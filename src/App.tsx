import { useState } from "react";
import { HeroSection } from "@/components/HeroSection";
import { ResultsPanel } from "@/components/ResultsPanel";
import { analyzeInput, type AnalysisResult } from "@/utils/analyze";
import { Toaster, toast } from "sonner";

export default function App() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async (input: string, type: "url" | "review") => {
    setIsLoading(true);
    setResult(null);
    try {
      const analysis = await analyzeInput(input, type);
      setResult(analysis);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Analysis failed. Please try again."
      );
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
        TrustScore AI Lens uses probabilistic analysis. Results are advisory, not
        definitive.
      </footer>
    </div>
  );
}
