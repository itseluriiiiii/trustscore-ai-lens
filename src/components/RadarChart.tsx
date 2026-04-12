import { motion } from "framer-motion";

interface RadarChartProps {
  categories: {
    reviewAuthenticity: number;
    behavioralPatterns: number;
    networkAnalysis: number;
    websiteLegitimacy: number;
    contactValidation: number;
  };
}

const labels = [
  { key: "reviewAuthenticity" as const, label: "Review Auth." },
  { key: "behavioralPatterns" as const, label: "Behavior" },
  { key: "networkAnalysis" as const, label: "Network" },
  { key: "websiteLegitimacy" as const, label: "Website" },
  { key: "contactValidation" as const, label: "Contact" },
];

function polarToCartesian(angle: number, radius: number, cx: number, cy: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

export function RadarChart({ categories }: RadarChartProps) {
  const cx = 150, cy = 150, maxR = 100;
  const step = 360 / 5;

  const points = labels.map((l, i) => {
    const val = categories[l.key] / 100;
    const angle = i * step;
    return polarToCartesian(angle, val * maxR, cx, cy);
  });

  const pathData = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-[280px] mx-auto">
      {[20, 40, 60, 80, 100].map((r) => {
        const ringPoints = Array.from({ length: 5 }, (_, i) =>
          polarToCartesian(i * step, (r / 100) * maxR, cx, cy)
        );
        const d = ringPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
        return <path key={r} d={d} fill="none" className="stroke-border" strokeWidth="0.5" opacity={0.4} />;
      })}

      {labels.map((_, i) => {
        const p = polarToCartesian(i * step, maxR, cx, cy);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} className="stroke-border" strokeWidth="0.5" opacity={0.3} />;
      })}

      <motion.path
        d={pathData}
        fill="oklch(0.72 0.19 160 / 0.15)"
        stroke="oklch(0.72 0.19 160)"
        strokeWidth="2"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />

      {labels.map((l, i) => {
        const p = polarToCartesian(i * step, maxR + 20, cx, cy);
        return (
          <text
            key={l.key}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted-foreground text-[10px]"
          >
            {l.label}
          </text>
        );
      })}
    </svg>
  );
}
