export default function Page() {
  return (
    <div style={{ maxWidth: 700, display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1C2620", fontFamily: "inherit" }}>Teacher Management</h2>
        <p style={{ fontSize: "12px", color: "#6E7A6C", marginTop: 2 }}>Manage your school&apos;s teaching staff</p>
      </div>
      <div style={{ background: "rgba(28,38,32,0.02)", border: "1px solid rgba(28,38,32,0.06)", borderRadius: "16px", padding: "40px", textAlign: "center" }}>
        <p style={{ fontSize: "15px", color: "#566257", fontFamily: "inherit", marginBottom: 8 }}>Teacher Management</p>
        <p style={{ fontSize: "13px", color: "#6E7A6C" }}>Full functionality for this section is being built in the next stage.</p>
      </div>
    </div>
  );
}
