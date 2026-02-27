import Skeleton from "@/components/Skeleton";

const card: React.CSSProperties = {
  background: "var(--bg-card)",
  borderRadius: 14,
  border: "1px solid var(--border-default)",
  padding: 20,
};

export default function AdminLoading() {
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

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
        <Skeleton width={200} height={22} borderRadius={6} style={{ marginBottom: 24 }} />

        {/* Metrics grid — 3 columns, 2 rows */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} style={card}>
              <Skeleton width={90} height={10} borderRadius={4} style={{ marginBottom: 10 }} />
              <Skeleton width={60} height={28} borderRadius={6} />
            </div>
          ))}
        </div>

        {/* Integration health row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={card}>
              <Skeleton width={120} height={10} borderRadius={4} style={{ marginBottom: 10 }} />
              <Skeleton width={40} height={24} borderRadius={6} />
            </div>
          ))}
        </div>

        {/* Table placeholder */}
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          {/* Table header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: 12,
            padding: "14px 20px",
            borderBottom: "1px solid var(--border-default)",
          }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} width={80} height={10} borderRadius={4} />
            ))}
          </div>
          {/* Table rows */}
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr",
              gap: 12,
              padding: "12px 20px",
              borderBottom: i < 5 ? "1px solid var(--border-light)" : "none",
            }}>
              <Skeleton width="70%" height={12} borderRadius={4} />
              <Skeleton width={60} height={12} borderRadius={4} />
              <Skeleton width={50} height={12} borderRadius={4} />
              <Skeleton width={70} height={12} borderRadius={4} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
