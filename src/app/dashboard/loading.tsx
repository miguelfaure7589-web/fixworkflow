import Skeleton from "@/components/Skeleton";

const card: React.CSSProperties = {
  background: "#fff",
  borderRadius: 14,
  border: "1px solid #e6e9ef",
  padding: 24,
};

export default function DashboardLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "#fafafa" }}>
      {/* Nav bar skeleton */}
      <div style={{
        height: 56,
        background: "#fff",
        borderBottom: "1px solid #e6e9ef",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        gap: 16,
      }}>
        <Skeleton width={120} height={20} borderRadius={6} />
        <div style={{ flex: 1 }} />
        <Skeleton width={32} height={32} borderRadius={16} />
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
        {/* Revenue Health Score card */}
        <div style={{ ...card, marginBottom: 20, padding: 32 }}>
          <Skeleton width={200} height={18} borderRadius={6} style={{ marginBottom: 20 }} />
          <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
            {/* Score circle */}
            <Skeleton width={120} height={120} borderRadius={60} />
            {/* Pillar bars */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Skeleton width={90} height={12} borderRadius={4} />
                  <Skeleton height={10} borderRadius={5} style={{ flex: 1 }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Playbook section */}
        <div style={{ ...card, marginBottom: 20 }}>
          <Skeleton width={180} height={16} borderRadius={6} style={{ marginBottom: 16 }} />
          {[1, 2, 3].map((i) => (
            <div key={i} style={{
              padding: "14px 0",
              borderBottom: i < 3 ? "1px solid #f0f2f5" : "none",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}>
              <Skeleton width={20} height={20} borderRadius={4} />
              <Skeleton width="60%" height={14} borderRadius={4} />
              <div style={{ flex: 1 }} />
              <Skeleton width={60} height={24} borderRadius={6} />
            </div>
          ))}
        </div>

        {/* AI Summary card */}
        <div style={{ ...card, marginBottom: 20 }}>
          <Skeleton width={160} height={16} borderRadius={6} style={{ marginBottom: 14 }} />
          <Skeleton height={12} borderRadius={4} style={{ marginBottom: 8 }} />
          <Skeleton height={12} borderRadius={4} style={{ marginBottom: 8 }} />
          <Skeleton width="75%" height={12} borderRadius={4} />
        </div>

        {/* Tool cards row */}
        <div style={{ ...card }}>
          <Skeleton width={160} height={16} borderRadius={6} style={{ marginBottom: 16 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{
                border: "1px solid #e6e9ef",
                borderRadius: 12,
                padding: 16,
              }}>
                <Skeleton width={40} height={40} borderRadius={10} style={{ marginBottom: 12 }} />
                <Skeleton width="70%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />
                <Skeleton height={10} borderRadius={4} style={{ marginBottom: 4 }} />
                <Skeleton width="50%" height={10} borderRadius={4} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
