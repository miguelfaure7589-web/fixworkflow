import Skeleton from "@/components/Skeleton";

export default function PricingLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)" }}>
      {/* Nav bar */}
      <div style={{
        height: 56,
        background: "var(--bg-card)",
        borderBottom: "1px solid var(--border-default)",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        gap: 16,
      }}>
        <Skeleton width={120} height={20} borderRadius={6} />
        <div style={{ flex: 1 }} />
        <Skeleton width={32} height={32} borderRadius={16} />
      </div>

      <div style={{ maxWidth: 880, margin: "0 auto", padding: "48px 16px", textAlign: "center" }}>
        {/* Title */}
        <Skeleton width={280} height={24} borderRadius={8} style={{ margin: "0 auto 12px" }} />
        <Skeleton width={360} height={14} borderRadius={6} style={{ margin: "0 auto 40px" }} />

        {/* Plan cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {[false, true].map((isPro, idx) => (
            <div key={idx} style={{
              background: "var(--bg-card)",
              border: isPro ? "2px solid #4361ee" : "1px solid var(--border-default)",
              borderRadius: 16,
              padding: 32,
              textAlign: "left",
            }}>
              {isPro && (
                <Skeleton width={100} height={20} borderRadius={10} style={{ marginBottom: 16 }} />
              )}
              <Skeleton width={80} height={18} borderRadius={6} style={{ marginBottom: 8 }} />
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
                <Skeleton width={60} height={32} borderRadius={6} />
                <Skeleton width={40} height={12} borderRadius={4} />
              </div>
              <Skeleton width="80%" height={12} borderRadius={4} style={{ marginBottom: 20 }} />
              <Skeleton height={44} borderRadius={10} style={{ marginBottom: 24 }} />
              {/* Feature list */}
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <Skeleton width={16} height={16} borderRadius={8} />
                  <Skeleton width={`${50 + i * 8}%`} height={12} borderRadius={4} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
