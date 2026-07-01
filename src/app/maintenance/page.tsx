export default function MaintenancePage() {
  return (
    <div style={{ minHeight: "100vh", background: "#07080C", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 480, textAlign: "center" }}>
        <div style={{ width: 80, height: 80, borderRadius: "22px", background: "linear-gradient(135deg, rgba(245,166,35,0.15), rgba(245,100,35,0.08))", border: "1px solid rgba(245,166,35,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38, margin: "0 auto 28px" }}>🔧</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif", marginBottom: 12 }}>Under Maintenance</h1>
        <p id="msg" style={{ fontSize: 14, color: "#6B7290", lineHeight: 1.7, marginBottom: 32 }}>
          The VOA platform is undergoing scheduled maintenance. We will be back shortly.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#F5A623", opacity: 0.4 + i * 0.2 }} />
          ))}
        </div>
        <p style={{ fontSize: 11, color: "#2A2D3E", marginTop: 40 }}>VOA · Vavhimi Online Academy</p>
      </div>
    </div>
  );
}
