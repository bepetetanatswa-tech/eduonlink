export default function Page() {
  return (
    <div style={{ maxWidth: 700, display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif" }}>Financials</h2>
        <p style={{ fontSize: "12px", color: "#4A5170", marginTop: 2 }}>School payment history and financial summary</p>
      </div>
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "40px", textAlign: "center" }}>
        <p style={{ fontSize: "15px", color: "#6B7290", fontFamily: "'Space Grotesk', sans-serif", marginBottom: 8 }}>Financials</p>
        <p style={{ fontSize: "13px", color: "#4A5170" }}>Full functionality for this section is being built in the next stage.</p>
      </div>
    </div>
  );
}
