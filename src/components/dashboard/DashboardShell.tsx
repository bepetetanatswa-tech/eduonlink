"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import type { UserRole } from "@/types/database";

interface Props {
  profile: {
    id: string;
    full_name: string;
    email: string;
    role: UserRole;
    avatar_url: string | null;
  };
  children: React.ReactNode;
}

export function DashboardShell({ profile, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#07080C" }}>
      <Sidebar
        role={profile.role}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        <TopBar
          profile={profile}
          onMenuClick={() => setSidebarOpen((prev) => !prev)}
        />
        <main style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
