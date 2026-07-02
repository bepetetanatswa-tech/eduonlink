"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/types/database";

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  created_at: string;
  suspended_at: string | null;
  suspension_reason: string | null;
}

const ROLE_COLOR: Record<string, string> = {
  super_admin: "#F5A623", school_admin: "#4D7FFF", teacher: "#00E5A3",
  student: "#BD93F9", parent: "#FF9A3C",
};
const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super Admin", school_admin: "School Admin",
  teacher: "Teacher", student: "Student", parent: "Parent",
};
const EDITABLE_ROLES = ["student", "teacher", "parent", "school_admin"];

function toCsv(rows: UserRow[]): string {
  const header = ["Name", "Email", "Role", "Phone", "Joined", "Status"];
  const lines = rows.map((u) => [
    u.full_name, u.email, ROLE_LABEL[u.role] ?? u.role, u.phone ?? "",
    new Date(u.created_at).toISOString(), u.suspended_at ? "Suspended" : "Active",
  ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
  return [header.join(","), ...lines].join("\n");
}

export function UserManagementClient({ initialUsers }: { initialUsers: UserRow[] }) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [viewing, setViewing] = useState<UserRow | null>(null);
  const [suspending, setSuspending] = useState<UserRow | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const notify = (msg: string) => { setNotification(msg); setTimeout(() => setNotification(null), 3000); };

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === "all" || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const call = async (url: string, body: unknown) => {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "Request failed");
    return data;
  };

  const toggleSuspend = async (u: UserRow, reason?: string) => {
    setBusy(u.id);
    try {
      await call("/api/admin/users/suspend", { targetId: u.id, suspend: !u.suspended_at, reason });
      setUsers((p) => p.map((x) => x.id === u.id ? { ...x, suspended_at: u.suspended_at ? null : new Date().toISOString(), suspension_reason: u.suspended_at ? null : (reason ?? null) } : x));
      notify(u.suspended_at ? "User unsuspended ✓" : "User suspended ✓");
      setSuspending(null);
      setSuspendReason("");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  };

  const deleteUser = async (u: UserRow) => {
    if (!confirm(`Permanently delete ${u.full_name}? This cannot be undone.`)) return;
    setBusy(u.id);
    try {
      await call("/api/admin/users/delete", { targetId: u.id });
      setUsers((p) => p.filter((x) => x.id !== u.id));
      notify("User deleted");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  };

  const resetPassword = async (u: UserRow) => {
    setBusy(u.id);
    try {
      await call("/api/admin/users/reset-password", { targetId: u.id });
      notify(`Password reset email sent to ${u.email}`);
    } catch (e) {
      notify(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  };

  const changeRole = async (u: UserRow, newRole: string) => {
    setBusy(u.id);
    try {
      await call("/api/admin/users/update-role", { targetId: u.id, newRole });
      setUsers((p) => p.map((x) => x.id === u.id ? { ...x, role: newRole as UserRole } : x));
      setViewing((v) => v && v.id === u.id ? { ...v, role: newRole as UserRole } : v);
      notify("Role updated ✓");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  };

  const impersonate = async (u: UserRow) => {
    setBusy(u.id);
    try {
      const data = await call("/api/admin/impersonate/start", { targetProfileId: u.id });
      router.push(data.redirectTo);
    } catch (e) {
      notify(e instanceof Error ? e.message : "Failed");
      setBusy(null);
    }
  };

  const exportCsv = (rows: UserRow[]) => {
    const blob = new Blob([toCsv(rows)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `voa-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelect = (id: string) => {
    setSelected((p) => {
      const next = new Set(p);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const bulkSuspend = async () => {
    const targets = users.filter((u) => selected.has(u.id) && u.role !== "super_admin" && !u.suspended_at);
    if (targets.length === 0) return;
    if (!confirm(`Suspend ${targets.length} selected user(s)?`)) return;
    for (const u of targets) await toggleSuspend(u, "Bulk suspension");
    setSelected(new Set());
  };

  return (
    <div style={{ maxWidth: 1000, display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif" }}>User Management</h2>
          <p style={{ fontSize: "12px", color: "#4A5170", marginTop: 2 }}>{users.length} total users · {filtered.length} shown{selected.size > 0 ? ` · ${selected.size} selected` : ""}</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {notification && <span style={{ fontSize: 12, color: "#00E5A3" }}>{notification}</span>}
          {selected.size > 0 && (
            <button onClick={bulkSuspend} style={{ padding: "8px 16px", borderRadius: 9, fontSize: 12, fontWeight: 600, background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)", color: "#FF6B6B", cursor: "pointer" }}>
              Suspend {selected.size} selected
            </button>
          )}
          <button onClick={() => exportCsv(filtered)} style={{ padding: "8px 16px", borderRadius: 9, fontSize: 12, fontWeight: 600, background: "rgba(77,127,255,0.1)", border: "1px solid rgba(77,127,255,0.25)", color: "#4D7FFF", cursor: "pointer" }}>
            Export CSV
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <input
            type="text" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "9px 12px 9px 36px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", color: "#CDD6F4", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
          />
          <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#4A5170" }} width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}
          style={{ padding: "9px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", color: filterRole === "all" ? "#6B7290" : "#CDD6F4", fontSize: "13px", outline: "none", cursor: "pointer" }}
        >
          <option value="all">All roles</option>
          {Object.entries(ROLE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>

      {/* View/edit modal */}
      {viewing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ width: "100%", maxWidth: 460, background: "#0D1021", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#CDD6F4", margin: 0 }}>{viewing.full_name}</h3>
              <button onClick={() => setViewing(null)} style={{ background: "none", border: "none", color: "#6B7290", fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#8892B0" }}>
              <p style={{ margin: 0 }}><span style={{ color: "#4A5170" }}>Email:</span> {viewing.email}</p>
              <p style={{ margin: 0 }}><span style={{ color: "#4A5170" }}>Phone:</span> {viewing.phone ?? "—"}</p>
              <p style={{ margin: 0 }}><span style={{ color: "#4A5170" }}>Joined:</span> {new Date(viewing.created_at).toLocaleDateString()}</p>
              <p style={{ margin: 0 }}><span style={{ color: "#4A5170" }}>Status:</span> {viewing.suspended_at ? `Suspended (${viewing.suspension_reason})` : "Active"}</p>
            </div>
            {viewing.role !== "super_admin" && (
              <div>
                <label style={{ fontSize: 11, color: "#4A5170", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Role</label>
                <select value={viewing.role} onChange={(e) => changeRole(viewing, e.target.value)} disabled={busy === viewing.id}
                  style={{ width: "100%", padding: "8px 12px", background: "rgba(10,12,20,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 13, color: "#CDD6F4", outline: "none" }}
                >
                  {EDITABLE_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                </select>
              </div>
            )}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => impersonate(viewing)} disabled={busy === viewing.id || viewing.role === "super_admin"}
                style={{ padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.25)", color: "#F5A623", cursor: viewing.role === "super_admin" ? "not-allowed" : "pointer", opacity: viewing.role === "super_admin" ? 0.4 : 1 }}
              >
                👁️ View as this user
              </button>
              <button onClick={() => resetPassword(viewing)} disabled={busy === viewing.id}
                style={{ padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "rgba(77,127,255,0.1)", border: "1px solid rgba(77,127,255,0.25)", color: "#4D7FFF", cursor: "pointer" }}
              >
                Send password reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend reason modal */}
      {suspending && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ width: "100%", maxWidth: 400, background: "#0D1021", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#CDD6F4", margin: 0 }}>Suspend {suspending.full_name}?</h3>
            <textarea value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} rows={3} placeholder="Reason (visible to admins only)"
              style={{ width: "100%", padding: "8px 12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 13, color: "#CDD6F4", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => { setSuspending(null); setSuspendReason(""); }} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 12, background: "none", border: "1px solid rgba(255,255,255,0.08)", color: "#6B7290", cursor: "pointer" }}>Cancel</button>
              <button onClick={() => toggleSuspend(suspending, suspendReason)} disabled={busy === suspending.id} style={{ padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, background: "rgba(255,107,107,0.9)", border: "none", color: "#fff", cursor: "pointer" }}>
                {busy === suspending.id ? "Suspending…" : "Suspend"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <th style={{ padding: "12px 8px" }}></th>
                {["User", "Role", "Status", "Joined", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "10px", fontWeight: 600, color: "#4A5170", letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#4A5170", fontSize: "13px" }}>{search || filterRole !== "all" ? "No users match your filters" : "No users yet"}</td></tr>
              ) : filtered.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <td style={{ padding: "14px 8px", textAlign: "center" }}>
                    {u.role !== "super_admin" && (
                      <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggleSelect(u.id)} style={{ accentColor: "#4D7FFF" }} />
                    )}
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: 32, height: 32, borderRadius: "9px", flexShrink: 0, background: `linear-gradient(135deg, ${ROLE_COLOR[u.role]}30, ${ROLE_COLOR[u.role]}60)`, border: `1px solid ${ROLE_COLOR[u.role]}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: ROLE_COLOR[u.role] }}>
                        {u.full_name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "#CDD6F4", margin: 0 }}>{u.full_name}</p>
                        <p style={{ fontSize: "11px", color: "#4A5170", margin: 0 }}>{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "6px", color: ROLE_COLOR[u.role], background: `${ROLE_COLOR[u.role]}15`, border: `1px solid ${ROLE_COLOR[u.role]}30` }}>
                      {ROLE_LABEL[u.role] ?? u.role}
                    </span>
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "6px", color: u.suspended_at ? "#FF6B6B" : "#00E5A3", background: u.suspended_at ? "rgba(255,107,107,0.1)" : "rgba(0,229,163,0.1)", border: `1px solid ${u.suspended_at ? "rgba(255,107,107,0.25)" : "rgba(0,229,163,0.25)"}` }}>
                      {u.suspended_at ? "Suspended" : "Active"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: "11px", color: "#4A5170", whiteSpace: "nowrap" }}>
                    {new Date(u.created_at).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      <button onClick={() => setViewing(u)} style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, background: "rgba(77,127,255,0.1)", border: "1px solid rgba(77,127,255,0.2)", color: "#4D7FFF", cursor: "pointer" }}>
                        View
                      </button>
                      {u.role !== "super_admin" && (
                        <>
                          <button onClick={() => u.suspended_at ? toggleSuspend(u) : setSuspending(u)} disabled={busy === u.id}
                            style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, background: u.suspended_at ? "rgba(0,229,163,0.08)" : "rgba(255,107,107,0.08)", border: `1px solid ${u.suspended_at ? "rgba(0,229,163,0.15)" : "rgba(255,107,107,0.15)"}`, color: u.suspended_at ? "#00E5A3" : "#FF6B6B", cursor: "pointer" }}
                          >
                            {u.suspended_at ? "Unsuspend" : "Suspend"}
                          </button>
                          <button onClick={() => deleteUser(u)} disabled={busy === u.id}
                            style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "11px", background: "rgba(255,107,107,0.06)", border: "1px solid rgba(255,107,107,0.15)", color: "#FF6B6B", cursor: "pointer" }}
                          >
                            Delete
                          </button>
                        </>
                      )}
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
