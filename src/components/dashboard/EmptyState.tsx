"use client";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "48px 24px", textAlign: "center", gap: "12px",
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: "16px",
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#4A5170", marginBottom: "4px",
      }}>
        {icon}
      </div>
      <p style={{ fontSize: "15px", fontWeight: 600, color: "#8892B0", fontFamily: "'Space Grotesk', sans-serif" }}>{title}</p>
      <p style={{ fontSize: "13px", color: "#4A5170", maxWidth: "280px", lineHeight: 1.5 }}>{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop: "8px", padding: "8px 20px", borderRadius: "10px",
            background: "rgba(77,127,255,0.15)", border: "1px solid rgba(77,127,255,0.25)",
            color: "#4D7FFF", fontSize: "13px", fontWeight: 600, cursor: "pointer",
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
