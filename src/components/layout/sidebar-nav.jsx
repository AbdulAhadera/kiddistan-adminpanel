"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  FolderTree,
  LayoutDashboard,
  Layers3,
  LockKeyhole,
  Package,
  ShoppingBag,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mainNavigation = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Orders",
    href: "/admin/orders",
    icon: ShoppingBag,
  },
  {
    label: "Products",
    href: "/admin/products",
    icon: Package,
  },
  {
    label: "Categories",
    href: "/admin/categories",
    icon: FolderTree,
  },
  {
    label: "Collections",
    href: "/admin/collections",
    icon: Layers3,
  },
];

const lockedNavigation = [
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    label: "Inventory reports",
    href: "#",
    icon: Boxes,
  },
];

function NavLink({ item, onNavigate }) {
  const pathname = usePathname();
  const isLocked = item.href === "#";

  const isActive =
    !isLocked &&
    (pathname === item.href ||
      (item.href !== "/admin/dashboard" &&
        pathname.startsWith(`${item.href}/`)));

  const Icon = item.icon;

  if (isLocked) {
    return (
      <div
        title="This feature will be available later"
        className="flex cursor-not-allowed items-center gap-3 rounded-sm px-3 py-2 text-[13px] text-sidebar-foreground/55"
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1">{item.label}</span>
        <LockKeyhole className="h-3.5 w-3.5" />
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-sm px-3 py-2 text-[13px] font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-sidebar-foreground hover:bg-white/8 hover:text-white"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}

export function SidebarNav({ open = false, onClose }) {
  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/8 bg-sidebar transition-transform duration-200 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/8 px-5">
          <Link
            href="/admin/dashboard"
            className="flex min-w-0 items-center"
            aria-label="Kiddistan Admin dashboard"
          >
            <Image
              src="/kiddistan-logo.png"
              alt="Kiddistan"
              width={150}
              height={44}
              priority
              className="h-9 w-auto max-w-[150px] object-contain object-left"
            />
          </Link>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="rounded-sm p-1.5 text-sidebar-foreground hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/55">
            Store
          </p>

          <div className="space-y-1">
            {mainNavigation.map((item) => (
              <NavLink key={item.label} item={item} onNavigate={onClose} />
            ))}
          </div>

          <div className="my-5 border-t border-white/8" />

          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/55">
            Coming later
          </p>

          <div className="space-y-1">
            {lockedNavigation.map((item) => (
              <NavLink key={item.label} item={item} onNavigate={onClose} />
            ))}
          </div>
        </nav>

        <div className="border-t border-white/8 px-5 py-4">
          <p className="text-xs leading-5 text-sidebar-foreground/65">
            Kiddistan Admin
          </p>
          <p className="text-[11px] text-sidebar-foreground/45">
            Store management console
          </p>
        </div>
      </aside>
    </>
  );
}