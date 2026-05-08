import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrustScoreGauge } from "./TrustScoreGauge";
import { RadarChart } from "./RadarChart";
import { ShieldCheck, ShieldAlert, ShieldX, AlertTriangle, Info } from "lucide-react";
import type { AnalysisResult } from "@/utils/analyze";

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

export function ResultsPanel({ result }: ResultsPanelProps) {
  const risk = riskConfig[result.riskLevel];
  const rec = recConfig[result.recommendation];
  const RiskIcon = risk.icon;

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

      {result.recommendation === "Avoid" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-xl border border-trust-danger/30 bg-trust-danger/10 flex items-center gap-4"
        >
          <div className="p-2 rounded-full bg-trust-danger/20 text-trust-danger">
            <ShieldX className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-trust-danger uppercase tracking-wider">Safety Advisory</p>
            <p className="text-sm text-surface-foreground">
              This link exhibits high-risk patterns. <strong>Do not access the link</strong> if you suspect it is harmful.
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
