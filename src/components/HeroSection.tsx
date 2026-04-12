import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Shield, Search, Globe, MessageSquareText, Loader2 } from "lucide-react";

interface HeroSectionProps {
  onAnalyze: (input: string, type: "url" | "review") => void;
  isLoading: boolean;
}

export function HeroSection({ onAnalyze, isLoading }: HeroSectionProps) {
  const [input, setInput] = useState("");
  const [inputType, setInputType] = useState<"url" | "review">("url");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onAnalyze(input.trim(), inputType);
  };

  return (
    <div className="relative flex flex-col items-center text-center px-4 pt-16 pb-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center gap-2 mb-6"
      >
        <Shield className="w-8 h-8 text-primary" />
        <span className="text-2xl font-bold font-display tracking-tight">CheckMate AI</span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-4xl md:text-5xl lg:text-6xl font-bold font-display leading-tight max-w-3xl"
      >
        Trust Intelligence for{" "}
        <span className="text-primary">Safer Online Shopping</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-4 text-muted-foreground max-w-xl text-lg"
      >
        AI-powered analysis to detect fake reviews and scam websites instantly.
      </motion.p>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        onSubmit={handleSubmit}
        className="mt-10 w-full max-w-2xl space-y-4"
      >
        <div className="flex gap-2 justify-center">
          <button
            type="button"
            onClick={() => setInputType("url")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              inputType === "url"
                ? "bg-primary/15 text-primary border border-primary/30"
                : "bg-secondary text-muted-foreground border border-transparent hover:text-foreground"
            }`}
          >
            <Globe className="w-4 h-4" /> Website URL
          </button>
          <button
            type="button"
            onClick={() => setInputType("review")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              inputType === "review"
                ? "bg-primary/15 text-primary border border-primary/30"
                : "bg-secondary text-muted-foreground border border-transparent hover:text-foreground"
            }`}
          >
            <MessageSquareText className="w-4 h-4" /> Review Text
          </button>
        </div>

        <div className="relative">
          {inputType === "url" ? (
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter website URL (e.g., example.com)"
              className="w-full h-14 rounded-xl bg-card border border-border px-5 pr-14 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-body"
            />
          ) : (
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste a review to analyze..."
              rows={4}
              className="w-full rounded-xl bg-card border border-border px-5 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all resize-none font-body"
            />
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading || !input.trim()}
          size="lg"
          className="h-12 px-8 rounded-xl text-base font-semibold"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Analyze Now
            </>
          )}
        </Button>
      </motion.form>
    </div>
  );
}
