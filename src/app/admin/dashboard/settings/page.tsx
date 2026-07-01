export default function SettingsPage() {
  return (
    <div style={{ maxWidth: 700, display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif" }}>Platform Settings</h2>
        <p style={{ fontSize: "12px", color: "#4A5170", marginTop: 2 }}>Global configuration for the VOA platform</p>
      </div>
      {[
        { label: "Subscription Pricing", desc: "Set prices for Basic, Premium, and Enterprise plans", status: "Coming soon" },
        { label: "Maintenance Mode", desc: "Take the platform offline for maintenance", status: "Coming soon" },
        { label: "Feature Flags", desc: "Toggle experimental features for specific roles", status: "Coming soon" },
        { label: "Email Templates", desc: "Customise notification and welcome emails", status: "Coming soon" },
      ].map((item) => (
        <div key={item.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "#CDD6F4" }}>{item.label}</p>
            <p style={{ fontSize: "12px", color: "#4A5170", marginTop: 2 }}>{item.desc}</p>
          </div>
          <span style={{ fontSize: "10px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", color: "#4A5170", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", whiteSpace: "nowrap" }}>
            {item.status}
          </span>
        </div>
      ))}
    </div>
  );
}
