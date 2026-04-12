import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { HeroSection } from "@/components/HeroSection";
import { ResultsPanel } from "@/components/ResultsPanel";
import { analyzeInput, type AnalysisResult } from "@/utils/analyze.functions";
import { Toaster, toast } from "sonner";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "CheckMate AI – Trust Intelligence Engine" },
      { name: "description", content: "AI-powered analysis to detect fake reviews and scam websites. Get instant trust scores and safety recommendations." },
      { property: "og:title", content: "CheckMate AI – Trust Intelligence Engine" },
      { property: "og:description", content: "Detect fake reviews and scam websites with AI-powered trust analysis." },
    ],
  }),
});

function Index() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async (input: string, type: "url" | "review") => {
    setIsLoading(true);
    setResult(null);
    try {
      const analysis = await analyzeInput({ data: { input, type } });
      setResult(analysis);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Analysis failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" theme="dark" />
      <HeroSection onAnalyze={handleAnalyze} isLoading={isLoading} />
      {result && (
        <div className="px-4 pb-16">
          <ResultsPanel result={result} />
        </div>
      )}
      <footer className="text-center py-8 text-xs text-muted-foreground">
        CheckMate AI uses probabilistic analysis. Results are advisory, not definitive.
      </footer>
    </div>
  );
}
