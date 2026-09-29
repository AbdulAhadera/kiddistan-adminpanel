"use client";

import Image from "next/image";
import { LogOut, Menu, UserCircle } from "lucide-react";
import { useState } from "react";

import { logout } from "@/app/admin/(panel)/actions";
import { getInitials } from "@/lib/utils";

export function TopNavbar({
  onMenuClick,
  adminName = "Admin",
  adminEmail = "",
}) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    await logout();
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="inline-flex h-9 w-9 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Store Management
            </p>

            <p className="hidden text-xs text-muted-foreground sm:block">
              Kiddistan admin workspace
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden text-right sm:block">
          <p className="text-xs font-medium text-foreground">{adminName}</p>

          {adminEmail ? (
            <p className="max-w-48 truncate text-[11px] text-muted-foreground">
              {adminEmail}
            </p>
          ) : null}
        </div>

        <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-secondary text-xs font-semibold text-secondary-foreground">
          <Image
            src="/pfp.webp"
            alt="Kiddistan"
            width={32}
            height={32}
            className="h-8 w-8 rounded-sm object-cover"
            priority
          />
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          aria-label="Log out"
          title="Log out"
          className="inline-flex h-9 items-center gap-2 rounded-sm border border-border px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">
            {isLoggingOut ? "Logging out..." : "Logout"}
          </span>
        </button>
      </div>
    </header>
  );
}