import { IconWrench } from "@/components/icons";

export default function MaintenancePage() {
  return (
    <div style={{ minHeight: "100vh", background: "#F2EEE3", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 480, textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 4, background: "rgba(169,135,63,0.1)", border: "1px solid rgba(169,135,63,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px", color: "#8A6D2F" }}>
          <IconWrench size={28} />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 600, color: "#1C2620", fontFamily: "inherit", marginBottom: 12 }}>Under maintenance</h1>
        <p id="msg" style={{ fontSize: 14, color: "#566257", lineHeight: 1.7, marginBottom: 32 }}>
          The EduOnLink platform is undergoing scheduled maintenance. We&apos;ll be back shortly.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#A9873F", opacity: 0.4 + i * 0.2 }} />
          ))}
        </div>
        <p style={{ fontSize: 11, color: "#8D9689", marginTop: 40 }}>EduOnLink · A Vavhimi Threads product</p>
      </div>
    </div>
  );
}
