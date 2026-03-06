"use client";

import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export const PLAN_COLORS = {
  basico: {
    fill: "#b4fecc",
    text: "#22c55e",
  },
  estandar: {
    fill: "#7ce6f7",
    text: "#06b6d4",
  },
  pro: {
    fill: "#f84015",
    text: "#f84015",
  },
} as const;

type Plan = keyof typeof PLAN_COLORS;

interface DonutChartProps {
  completed: number;
  total: number;
  size?: number;
  plan?: Plan | null;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startAngle: number,
  endAngle: number,
) {
  const startOuter = polarToCartesian(cx, cy, rOuter, startAngle);
  const endOuter = polarToCartesian(cx, cy, rOuter, endAngle);
  const startInner = polarToCartesian(cx, cy, rInner, startAngle);
  const endInner = polarToCartesian(cx, cy, rInner, endAngle);
  const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${startInner.x} ${startInner.y}`,
    "Z",
  ].join(" ");
}

export function DonutChart({
  completed,
  total,
  size = 100,
  plan = "pro",
}: DonutChartProps) {
  const isCompleted = completed >= total && total > 0;
  const planKey = (plan ?? "pro") as keyof typeof PLAN_COLORS;
  const colors = isCompleted
    ? { fill: "var(--color-success-bright)", text: "var(--color-success-bright)" }
    : (PLAN_COLORS[planKey] ?? PLAN_COLORS.pro);
  const cx = 50;
  const cy = 50;
  const rOuter = 45;
  const rInner = 36;
  const gap = 4;
  const totalDeg = 360 - gap * Math.max(total, 1);
  const segmentAngle = totalDeg / Math.max(total, 1);
  const gray = "var(--color-segment-empty)";

  const segments = Array.from({ length: Math.max(total, 1) }, (_, i) => {
    const startAngle = gap / 2 + i * (segmentAngle + gap);
    const endAngle = startAngle + segmentAngle;
    const isFilled = i < completed;
    return {
      d: describeArc(cx, cy, rOuter, rInner, startAngle, endAngle),
      fill: isFilled ? colors.fill : gray,
    };
  });

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center",
        isCompleted && "animate-donut-complete",
      )}
    >
      <svg width={size} height={size} viewBox="0 0 100 100">
        {segments.map((seg, i) => (
          <path key={i} d={seg.d} fill={seg.fill} />
        ))}
        <circle cx={cx} cy={cy} r={rInner - 4} fill="var(--color-bg-card)" />
      </svg>
      <div
        className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
        style={{ color: colors.fill }}
      >
        <Activity size={28} strokeWidth={2} />
      </div>
    </div>
  );
}
