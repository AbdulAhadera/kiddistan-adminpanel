"use client";

import { useState } from "react";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { TopNavbar } from "@/components/layout/top-navbar";

export function AdminShell({ children, adminName, adminEmail }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <TopNavbar
          onMenuClick={() => setSidebarOpen(true)}
          adminName={adminName}
          adminEmail={adminEmail}
        />

        <main className="flex-1 p-4 sm:p-5 lg:p-6">{children}</main>
      </div>
    </div>
  );
}