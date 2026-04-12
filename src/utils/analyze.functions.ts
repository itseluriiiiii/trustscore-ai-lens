import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  input: z.string().min(1).max(5000),
  type: z.enum(["url", "review"]),
});

export type ScrapedEvidence = {
  finalUrl: string;
  isHttps: boolean;
  title: string;
  metaDescription: string;
  emailsFound: string[];
  phonesFound: string[];
  physicalAddresses: string[];
  socialLinks: string[];
  hasPrivacyPolicy: boolean;
  hasTermsOfService: boolean;
  hasContactPage: boolean;
  externalLinks: number;
  contentSnippet: string;
  scrapeError?: string;
};

export type AnalysisResult = {
  trustScore: number;
  riskLevel: "low" | "medium" | "high";
  recommendation: "Safe" | "Caution" | "Avoid";
  warnings: string[];
  explanation: string;
  categories: {
    reviewAuthenticity: number;
    behavioralPatterns: number;
    networkAnalysis: number;
    websiteLegitimacy: number;
    contactValidation: number;
  };
  scrapedEvidence?: ScrapedEvidence;
};

async function scrapeWebsite(rawUrl: string): Promise<ScrapedEvidence> {
  let url = rawUrl.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }

  const evidence: ScrapedEvidence = {
    finalUrl: url,
    isHttps: url.startsWith("https://"),
    title: "",
    metaDescription: "",
    emailsFound: [],
    phonesFound: [],
    physicalAddresses: [],
    socialLinks: [],
    hasPrivacyPolicy: false,
    hasTermsOfService: false,
    hasContactPage: false,
    externalLinks: 0,
    contentSnippet: "",
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CheckMateAI/1.0; +https://checkmate.ai)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);

    evidence.finalUrl = response.url;
    evidence.isHttps = response.url.startsWith("https://");

    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    evidence.title = titleMatch?.[1]?.trim().slice(0, 200) || "";

    // Extract meta description
    const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i)
      || html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["']/i);
    evidence.metaDescription = metaMatch?.[1]?.trim().slice(0, 300) || "";

    // Extract emails
    const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
    const emails = [...new Set(html.match(emailRegex) || [])];
    evidence.emailsFound = emails.filter(
      (e) => !e.endsWith(".png") && !e.endsWith(".jpg") && !e.endsWith(".css") && !e.endsWith(".js")
    ).slice(0, 10);

    // Extract phone numbers
    const phoneRegex = /(?:\+?\d{1,4}[\s\-.]?)?\(?\d{2,4}\)?[\s\-.]?\d{3,4}[\s\-.]?\d{3,4}/g;
    const phones = [...new Set(html.match(phoneRegex) || [])];
    evidence.phonesFound = phones
      .filter((p) => p.replace(/\D/g, "").length >= 7 && p.replace(/\D/g, "").length <= 15)
      .slice(0, 5);

    // Check for privacy policy, terms, contact
    const lowerHtml = html.toLowerCase();
    evidence.hasPrivacyPolicy = /privacy.?policy|privacypolicy/i.test(lowerHtml);
    evidence.hasTermsOfService = /terms.?of.?service|terms.?and.?conditions|termsofservice/i.test(lowerHtml);
    evidence.hasContactPage = /contact.?us|contactus|get.?in.?touch/i.test(lowerHtml);

    // Extract social links
    const socialPatterns = [
      /https?:\/\/(www\.)?facebook\.com\/[^\s"'<>]+/gi,
      /https?:\/\/(www\.)?twitter\.com\/[^\s"'<>]+/gi,
      /https?:\/\/(www\.)?x\.com\/[^\s"'<>]+/gi,
      /https?:\/\/(www\.)?instagram\.com\/[^\s"'<>]+/gi,
      /https?:\/\/(www\.)?linkedin\.com\/[^\s"'<>]+/gi,
      /https?:\/\/(www\.)?youtube\.com\/[^\s"'<>]+/gi,
    ];
    const socials: string[] = [];
    for (const pat of socialPatterns) {
      const matches = html.match(pat) || [];
      socials.push(...matches);
    }
    evidence.socialLinks = [...new Set(socials)].slice(0, 10);

    // Count external links
    const linkRegex = /href=["'](https?:\/\/[^"']+)["']/gi;
    const allLinks: string[] = [];
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      allLinks.push(match[1]);
    }
    const domain = new URL(evidence.finalUrl).hostname;
    evidence.externalLinks = allLinks.filter(
      (l) => {
        try { return new URL(l).hostname !== domain; } catch { return false; }
      }
    ).length;

    // Strip HTML tags for a text snippet
    const textContent = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    evidence.contentSnippet = textContent.slice(0, 2000);

    // Try to also fetch /contact page for more details
    try {
      const contactUrl = new URL("/contact", evidence.finalUrl).href;
      const contactController = new AbortController();
      const contactTimeout = setTimeout(() => contactController.abort(), 8000);
      const contactRes = await fetch(contactUrl, {
        signal: contactController.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; CheckMateAI/1.0)" },
        redirect: "follow",
      });
      clearTimeout(contactTimeout);

      if (contactRes.ok) {
        const contactHtml = await contactRes.text();
        const contactEmails = [...new Set(contactHtml.match(emailRegex) || [])];
        const contactPhones = [...new Set(contactHtml.match(phoneRegex) || [])];
        evidence.emailsFound = [...new Set([...evidence.emailsFound, ...contactEmails])].slice(0, 10);
        evidence.phonesFound = [...new Set([
          ...evidence.phonesFound,
          ...contactPhones.filter((p) => p.replace(/\D/g, "").length >= 7 && p.replace(/\D/g, "").length <= 15),
        ])].slice(0, 5);

        // Look for physical addresses (basic patterns)
        const addressPatterns = [
          /\d{1,5}\s+[\w\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct)[\s,]+[\w\s]+,?\s*[A-Z]{2}\s*\d{5}/gi,
          /(?:Suite|Ste|Floor|Unit)\s*#?\d+[\s,]+\d+\s+[\w\s]+/gi,
        ];
        for (const ap of addressPatterns) {
          const addrs = contactHtml.match(ap) || [];
          evidence.physicalAddresses.push(...addrs);
        }
        evidence.physicalAddresses = [...new Set(evidence.physicalAddresses)].slice(0, 3);
      }
    } catch {
      // Contact page not available, that's fine
    }
  } catch (err) {
    evidence.scrapeError = err instanceof Error ? err.message : "Failed to fetch website";
  }

  return evidence;
}

export const analyzeInput = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<AnalysisResult> => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) throw new Error("AI service not configured");

    let scrapedEvidence: ScrapedEvidence | undefined;
    let websiteContext = "";

    if (data.type === "url") {
      scrapedEvidence = await scrapeWebsite(data.input);

      websiteContext = `
=== LIVE WEBSITE SCRAPE DATA ===
Final URL: ${scrapedEvidence.finalUrl}
HTTPS: ${scrapedEvidence.isHttps ? "Yes" : "NO — HTTP only (major red flag)"}
Page Title: ${scrapedEvidence.title || "NONE FOUND"}
Meta Description: ${scrapedEvidence.metaDescription || "NONE FOUND"}
Emails Found: ${scrapedEvidence.emailsFound.length > 0 ? scrapedEvidence.emailsFound.join(", ") : "NONE"}
Phone Numbers Found: ${scrapedEvidence.phonesFound.length > 0 ? scrapedEvidence.phonesFound.join(", ") : "NONE"}
Physical Addresses: ${scrapedEvidence.physicalAddresses.length > 0 ? scrapedEvidence.physicalAddresses.join("; ") : "NONE"}
Social Media Links: ${scrapedEvidence.socialLinks.length > 0 ? scrapedEvidence.socialLinks.join(", ") : "NONE"}
Has Privacy Policy: ${scrapedEvidence.hasPrivacyPolicy ? "Yes" : "No"}
Has Terms of Service: ${scrapedEvidence.hasTermsOfService ? "Yes" : "No"}
Has Contact Page: ${scrapedEvidence.hasContactPage ? "Yes" : "No"}
External Links Count: ${scrapedEvidence.externalLinks}
${scrapedEvidence.scrapeError ? `SCRAPE ERROR: ${scrapedEvidence.scrapeError}` : ""}

=== PAGE CONTENT EXCERPT ===
${scrapedEvidence.contentSnippet}
=== END SCRAPE DATA ===`;
    }

    const systemPrompt = `You are CheckMate AI, a Trust Intelligence Engine. You analyze ${data.type === "url" ? "websites by examining ACTUAL SCRAPED DATA from the live site" : "review text for authenticity patterns"}.

You MUST respond with ONLY a valid JSON object (no markdown, no code fences) with this exact structure:
{
  "trustScore": <number 0-100>,
  "riskLevel": "<low|medium|high>",
  "recommendation": "<Safe|Caution|Avoid>",
  "warnings": ["<warning1>", "<warning2>", ...],
  "explanation": "<2-3 sentence summary using probabilistic language>",
  "categories": {
    "reviewAuthenticity": <number 0-100>,
    "behavioralPatterns": <number 0-100>,
    "networkAnalysis": <number 0-100>,
    "websiteLegitimacy": <number 0-100>,
    "contactValidation": <number 0-100>
  }
}

${data.type === "url" ? `CRITICAL URL ANALYSIS INSTRUCTIONS:
You have been provided with REAL scraped data from the website. Use this data to form your analysis:

1. CONTACT VALIDATION: 
   - Check if emails are found. If found, assess if they use the site's own domain (good) or free providers like gmail (suspicious for businesses).
   - Check if phone numbers are present. Missing phone = red flag for e-commerce.
   - Check for physical addresses. No address = concerning for businesses.

2. WEBSITE LEGITIMACY:
   - Is HTTPS enabled? HTTP-only is a major red flag.
   - Does the site have a proper title and meta description?
   - Does it have Privacy Policy, Terms of Service, Contact page?
   - Check the actual page content for quality, specificity, and professionalism.

3. NETWORK ANALYSIS:
   - Check social media links — are they present and do they link to real profiles?
   - How many external links exist?
   - Does the content look template-based or unique?

4. BEHAVIORAL PATTERNS:
   - Does the content appear auto-generated or template-based?
   - Are there excessive discount claims or urgency tactics?
   - Is the content coherent and well-written?

5. REVIEW AUTHENTICITY (for the site's own reviews if visible in content):
   - Look for review patterns in the scraped content.
` : `REVIEW ANALYSIS INSTRUCTIONS:
- Check for generic language, excessive superlatives, repetitive phrasing
- Look for AI-generated patterns (overly perfect grammar, lack of specifics)
- Check for emotional manipulation tactics
- Assess specificity — genuine reviews mention specific features, problems, timelines
- Consider review length and detail level`}

Rules:
- Use probabilistic language ("may indicate", "suggests", "appears to")
- Never make definitive accusations
- Base scores on ACTUAL EVIDENCE from the scraped data, not assumptions
- Be helpful and fair — legitimate sites with good contact info should score high
- If the website couldn't be scraped, note that and score conservatively`;

    const userMessage = data.type === "url"
      ? `Analyze this website: ${data.input}\n\n${websiteContext}`
      : `Analyze this review text: ${data.input}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) throw new Error("Rate limited. Please try again shortly.");
      if (response.status === 402) throw new Error("AI credits exhausted. Please add funds.");
      throw new Error("AI analysis failed");
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");

    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned) as AnalysisResult;
      if (scrapedEvidence) {
        parsed.scrapedEvidence = scrapedEvidence;
      }
      return parsed;
    } catch {
      throw new Error("Failed to parse analysis results");
    }
  });
