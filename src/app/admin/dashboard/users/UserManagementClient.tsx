"use client";

import { useState } from "react";
import type { UserRole } from "@/types/database";

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  created_at: string;
}

const ROLE_COLOR: Record<string, string> = {
  super_admin: "#F5A623", school_admin: "#4D7FFF", teacher: "#00E5A3",
  student: "#BD93F9", parent: "#FF9A3C",
};
const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super Admin", school_admin: "School Admin",
  teacher: "Teacher", student: "Student", parent: "Parent",
};

export function UserManagementClient({ initialUsers }: { initialUsers: UserRow[] }) {
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");

  const filtered = initialUsers.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === "all" || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div style={{ maxWidth: 1000, display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif" }}>
            User Management
          </h2>
          <p style={{ fontSize: "12px", color: "#4A5170", marginTop: 2 }}>
            {initialUsers.length} total users · {filtered.length} shown
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "9px 12px 9px 36px",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "10px", color: "#CDD6F4", fontSize: "13px", outline: "none",
              boxSizing: "border-box",
            }}
          />
          <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#4A5170" }} width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          style={{
            padding: "9px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "10px", color: filterRole === "all" ? "#6B7290" : "#CDD6F4", fontSize: "13px", outline: "none", cursor: "pointer",
          }}
        >
          <option value="all">All roles</option>
          {Object.entries(ROLE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                {["User", "Role", "Phone", "Joined", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "10px", fontWeight: 600, color: "#4A5170", letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "#4A5170", fontSize: "13px" }}>
                    {search || filterRole !== "all" ? "No users match your filters" : "No users yet"}
                  </td>
                </tr>
              ) : filtered.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", transition: "background 0.1s" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.02)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "transparent")}
                >
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: "9px", flexShrink: 0,
                        background: `linear-gradient(135deg, ${ROLE_COLOR[u.role]}30, ${ROLE_COLOR[u.role]}60)`,
                        border: `1px solid ${ROLE_COLOR[u.role]}40`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "12px", fontWeight: 700, color: ROLE_COLOR[u.role],
                      }}>
                        {u.full_name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "#CDD6F4" }}>{u.full_name}</p>
                        <p style={{ fontSize: "11px", color: "#4A5170" }}>{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{
                      fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "6px",
                      color: ROLE_COLOR[u.role], background: `${ROLE_COLOR[u.role]}15`,
                      border: `1px solid ${ROLE_COLOR[u.role]}30`,
                    }}>
                      {ROLE_LABEL[u.role] ?? u.role}
                    </span>
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: "12px", color: "#6B7290" }}>{u.phone ?? "—"}</td>
                  <td style={{ padding: "14px 20px", fontSize: "11px", color: "#4A5170", whiteSpace: "nowrap" }}>
                    {new Date(u.created_at).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        style={{
                          padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600,
                          background: "rgba(77,127,255,0.1)", border: "1px solid rgba(77,127,255,0.2)",
                          color: "#4D7FFF", cursor: "pointer",
                        }}
                      >
                        View
                      </button>
                      <button
                        style={{
                          padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600,
                          background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.15)",
                          color: "#FF6B6B", cursor: "pointer",
                        }}
                      >
                        Suspend
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
