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
  };
  children: React.ReactNode;
}

export function DashboardShell({ profile, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-edu-paper">
      <Sidebar
        role={profile.role}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/*
        Desktop (lg+): sidebar is position:fixed at width 220px, so offset content with pl-[220px].
        Mobile: sidebar is a fixed overlay — never in layout flow — so no padding, full 100vw.
      */}
      <div className="lg:pl-[220px] flex flex-col min-h-screen">
        <TopBar
          profile={profile}
          onMenuClick={() => setSidebarOpen((prev) => !prev)}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      <PushPermissionPrompt />
    </div>
  );
}
