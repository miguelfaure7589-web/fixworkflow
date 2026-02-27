"use client";

import { useTheme } from "@/components/ThemeProvider";

const RADIUS = 20;
const STROKE = 4;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function MiniProgressRing({
  score,
  color,
  size = 48,
}: {
  score: number;
  color: string;
  size?: number;
}) {
  const { isDark } = useTheme();
  const pct = Math.max(0, Math.min(100, score));
  const offset = CIRCUMFERENCE * (1 - pct / 100);
  const center = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background ring */}
      <circle
        cx={center}
        cy={center}
        r={RADIUS}
        fill="none"
        stroke={isDark ? "#252838" : "#f0f2f6"}
        strokeWidth={STROKE}
      />
      {/* Progress ring */}
      <circle
        cx={center}
        cy={center}
        r={RADIUS}
        fill="none"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${center} ${center})`}
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      {/* Score text */}
      <text
        x={center}
        y={center}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={13}
        fontWeight={700}
        fill={isDark ? "#e4e4e7" : "#1b2434"}
        fontFamily="sans-serif"
      >
        {pct}
      </text>
    </svg>
  );
}
