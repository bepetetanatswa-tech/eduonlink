"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const S = { border: "rgba(28,38,32,0.07)", accent: "#A9873F", dim: "#6E7A6C" };

export function SbpBottomNav({ basePath, activeProjectId, profilePath }: { basePath: string; activeProjectId: string | null; profilePath: string }) {
 const pathname = usePathname();

 const tabs = [
 { key: "home", label: "Home", icon: "", href: basePath },
 { key: "new", label: "New Project", icon: "", href: `${basePath}?new=1` },
 { key: "projects", label: "My Projects", icon: "", href: basePath },
 { key: "stages", label: "Stages", icon: "", href: activeProjectId ? `${basePath}/${activeProjectId}` : basePath },
 { key: "profile", label: "Profile", icon: "", href: profilePath },
 ];

 return (
 <div style={{
 position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
 display: "flex", background: "#F2EEE3", borderTop: `1px solid ${S.border}`,
 paddingBottom: "env(safe-area-inset-bottom)",
 }} className="lg:pl-[220px]">
 {tabs.map((t) => {
 const isActive = t.key === "profile" ? pathname === profilePath : pathname.startsWith(t.href.split("?")[0]) && t.key !== "new";
 return (
 <Link key={t.key} href={t.href}
 style={{
 flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
 padding: "9px 4px", textDecoration: "none",
 color: isActive ? S.accent : S.dim,
 }}>
 <span style={{ fontSize: 18 }}>{t.icon}</span>
 <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500 }}>{t.label}</span>
 </Link>
 );
 })}
 </div>
 );
}
