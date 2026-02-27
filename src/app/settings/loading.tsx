import Skeleton from "@/components/Skeleton";

const card: React.CSSProperties = {
  background: "var(--bg-card)",
  borderRadius: 14,
  border: "1px solid var(--border-default)",
  padding: 24,
  marginBottom: 16,
};

export default function SettingsLoading() {
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

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 16px", display: "flex", gap: 32 }}>
        {/* Sidebar */}
        <div style={{ width: 220, flexShrink: 0 }}>
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} style={{ padding: "10px 14px", marginBottom: 4 }}>
              <Skeleton width={i === 1 ? "80%" : `${50 + i * 7}%`} height={14} borderRadius={6} />
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          {/* Section header */}
          <Skeleton width={140} height={20} borderRadius={6} style={{ marginBottom: 20 }} />

          {/* Profile card */}
          <div style={card}>
            <Skeleton width={100} height={14} borderRadius={6} style={{ marginBottom: 16 }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <Skeleton width={50} height={10} borderRadius={4} style={{ marginBottom: 6 }} />
                <Skeleton height={40} borderRadius={10} />
              </div>
              <div>
                <Skeleton width={50} height={10} borderRadius={4} style={{ marginBottom: 6 }} />
                <Skeleton height={40} borderRadius={10} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <Skeleton width={80} height={10} borderRadius={4} style={{ marginBottom: 6 }} />
                <Skeleton height={40} borderRadius={10} />
              </div>
              <div>
                <Skeleton width={80} height={10} borderRadius={4} style={{ marginBottom: 6 }} />
                <Skeleton height={40} borderRadius={10} />
              </div>
            </div>
          </div>

          {/* Password card */}
          <div style={card}>
            <Skeleton width={80} height={14} borderRadius={6} style={{ marginBottom: 10 }} />
            <Skeleton width="60%" height={12} borderRadius={4} />
          </div>

          {/* Delete card */}
          <div style={{ ...card, border: "1px solid rgba(239,68,68,0.1)", background: "rgba(239,68,68,0.04)" }}>
            <Skeleton width={120} height={14} borderRadius={6} style={{ marginBottom: 10 }} />
            <Skeleton width="80%" height={12} borderRadius={4} />
          </div>
        </div>
      </div>
    </div>
  );
}
