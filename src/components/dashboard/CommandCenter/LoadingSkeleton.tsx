"use client";

function Bone({ width, height, radius = 8 }: { width: string | number; height: number; radius?: number }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: "linear-gradient(90deg, var(--skeleton-base) 25%, var(--skeleton-shine) 50%, var(--skeleton-base) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s ease-in-out infinite",
      }}
    />
  );
}

export default function LoadingSkeleton() {
  return (
    <div style={{ padding: 0 }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Revenue overview skeleton */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 16 }}>
          <Bone width={180} height={40} />
          <Bone width={80} height={20} />
        </div>
        <Bone width="100%" height={200} radius={12} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 16 }}>
          {[1, 2, 3, 4].map((i) => (
            <Bone key={i} width="100%" height={80} radius={12} />
          ))}
        </div>
      </div>

      {/* Pillar cards skeleton */}
      <div style={{ marginBottom: 24 }}>
        <Bone width={120} height={14} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginTop: 12 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Bone key={i} width="100%" height={140} radius={12} />
          ))}
        </div>
      </div>

      {/* Integration streams skeleton */}
      <div style={{ marginBottom: 24 }}>
        <Bone width={160} height={14} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginTop: 12 }}>
          {[1, 2].map((i) => (
            <Bone key={i} width="100%" height={120} radius={12} />
          ))}
        </div>
      </div>
    </div>
  );
}
