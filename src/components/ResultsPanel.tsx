import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrustScoreGauge } from "./TrustScoreGauge";
import { RadarChart } from "./RadarChart";
import { ShieldCheck, ShieldAlert, ShieldX, AlertTriangle, Info, Globe, Mail, Phone, MapPin, Lock, FileText, ExternalLink } from "lucide-react";
import type { AnalysisResult } from "@/utils/analyze.functions";

interface ResultsPanelProps {
  result: AnalysisResult;
}

const riskConfig = {
  low: { icon: ShieldCheck, label: "Low Risk", badgeClass: "bg-trust-safe/15 text-trust-safe border-trust-safe/30" },
  medium: { icon: ShieldAlert, label: "Medium Risk", badgeClass: "bg-trust-caution/15 text-trust-caution border-trust-caution/30" },
  high: { icon: ShieldX, label: "High Risk", badgeClass: "bg-trust-danger/15 text-trust-danger border-trust-danger/30" },
};

const recConfig = {
  Safe: { class: "text-trust-safe", label: "✓ Appears Safe" },
  Caution: { class: "text-trust-caution", label: "⚠ Proceed with Caution" },
  Avoid: { class: "text-trust-danger", label: "✕ Consider Avoiding" },
};

function EvidenceRow({ icon: Icon, label, value, status }: { icon: React.ElementType; label: string; value: string; status: "good" | "warning" | "bad" | "neutral" }) {
  const statusColors = {
    good: "text-trust-safe",
    warning: "text-trust-caution",
    bad: "text-trust-danger",
    neutral: "text-muted-foreground",
  };
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${statusColors[status]}`} />
      <div className="min-w-0">
        <span className="text-xs text-muted-foreground">{label}</span>
        <p className={`text-sm ${statusColors[status]} break-all`}>{value}</p>
      </div>
    </div>
  );
}

export function ResultsPanel({ result }: ResultsPanelProps) {
  const risk = riskConfig[result.riskLevel];
  const rec = recConfig[result.recommendation];
  const RiskIcon = risk.icon;
  const ev = result.scrapedEvidence;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-5xl mx-auto space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <TrustScoreGauge score={result.trustScore} riskLevel={result.riskLevel} />
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ${risk.badgeClass}`}>
              <RiskIcon className="w-4 h-4" />
              {risk.label}
            </div>
            <p className={`text-lg font-semibold ${rec.class}`}>{rec.label}</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Analysis Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <RadarChart categories={result.categories} />
          </CardContent>
        </Card>
      </div>

      {ev && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                Website Scrape Evidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">
                <EvidenceRow
                  icon={Lock}
                  label="HTTPS / SSL"
                  value={ev.isHttps ? "Secure (HTTPS)" : "NOT SECURE (HTTP only)"}
                  status={ev.isHttps ? "good" : "bad"}
                />
                <EvidenceRow
                  icon={Mail}
                  label="Emails Found"
                  value={ev.emailsFound.length > 0 ? ev.emailsFound.join(", ") : "None found"}
                  status={ev.emailsFound.length > 0 ? "good" : "warning"}
                />
                <EvidenceRow
                  icon={Phone}
                  label="Phone Numbers"
                  value={ev.phonesFound.length > 0 ? ev.phonesFound.join(", ") : "None found"}
                  status={ev.phonesFound.length > 0 ? "good" : "warning"}
                />
                <EvidenceRow
                  icon={MapPin}
                  label="Physical Address"
                  value={ev.physicalAddresses.length > 0 ? ev.physicalAddresses.join("; ") : "None found"}
                  status={ev.physicalAddresses.length > 0 ? "good" : "warning"}
                />
                <EvidenceRow
                  icon={FileText}
                  label="Legal Pages"
                  value={[
                    ev.hasPrivacyPolicy ? "Privacy Policy ✓" : "Privacy Policy ✗",
                    ev.hasTermsOfService ? "Terms ✓" : "Terms ✗",
                    ev.hasContactPage ? "Contact ✓" : "Contact ✗",
                  ].join(" · ")}
                  status={ev.hasPrivacyPolicy && ev.hasTermsOfService ? "good" : ev.hasPrivacyPolicy || ev.hasTermsOfService ? "warning" : "bad"}
                />
                <EvidenceRow
                  icon={ExternalLink}
                  label="Social Media"
                  value={ev.socialLinks.length > 0 ? `${ev.socialLinks.length} links found` : "None found"}
                  status={ev.socialLinks.length > 0 ? "good" : "neutral"}
                />
              </div>
              {ev.scrapeError && (
                <p className="mt-3 text-xs text-trust-danger">⚠ Scrape issue: {ev.scrapeError}</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-trust-caution" />
              Key Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.warnings.length > 0 ? (
              <ul className="space-y-2">
                {result.warnings.map((w, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i }}
                    className="flex items-start gap-2 text-sm text-surface-foreground"
                  >
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-trust-caution shrink-0" />
                    {w}
                  </motion.li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No significant warnings detected.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              Explanation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{result.explanation}</p>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
