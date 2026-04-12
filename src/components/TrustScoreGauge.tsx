import { motion } from "framer-motion";

interface TrustScoreGaugeProps {
  score: number;
  riskLevel: "low" | "medium" | "high";
}

export function TrustScoreGauge({ score, riskLevel }: TrustScoreGaugeProps) {
  const colorClass =
    riskLevel === "low" ? "text-trust-safe" :
    riskLevel === "medium" ? "text-trust-caution" : "text-trust-danger";

  const bgColorClass =
    riskLevel === "low" ? "stroke-trust-safe" :
    riskLevel === "medium" ? "stroke-trust-caution" : "stroke-trust-danger";

  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="220" height="220" viewBox="0 0 220 220" className="-rotate-90">
        <circle
          cx="110" cy="110" r="90"
          fill="none"
          className="stroke-muted"
          strokeWidth="8"
        />
        <motion.circle
          cx="110" cy="110" r="90"
          fill="none"
          className={bgColorClass}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span
          className={`text-6xl font-bold font-display ${colorClass}`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {score}
        </motion.span>
        <span className="text-sm text-muted-foreground mt-1">Trust Score</span>
      </div>
    </div>
  );
}
