"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { PushPermissionPrompt } from "@/components/push/PushPermissionPrompt";
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
    <div style={{ minHeight: "100vh", background: "#07080C" }}>
      <Sidebar
        role={profile.role}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/*
        Desktop (lg+): sidebar is position:fixed at width 220px, so offset content with pl-[220px].
        Mobile: sidebar is a fixed overlay — never in layout flow — so no padding, full 100vw.
      */}
      <div
        className="lg:pl-[220px]"
        style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <TopBar
          profile={profile}
          onMenuClick={() => setSidebarOpen((prev) => !prev)}
        />
        <main style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {children}
        </main>
      </div>

      <PushPermissionPrompt />
    </div>
  );
}
