import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/*
  Combines Tailwind classes safely.
  Example:
  cn("px-3 py-2", isActive && "bg-primary text-primary-foreground")
*/
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/*
  Formats live prices from Supabase.
  Example: 2499 → PKR 2,499
*/
export function formatPKR(amount) {
  const value = Number(amount || 0);

  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/*
  Formats numeric values.
  Example: 12500 → 12,500
*/
export function formatNumber(value) {
  return new Intl.NumberFormat("en-PK").format(Number(value || 0));
}

/*
  Formats date values stored by Supabase.
  Example: 2026-09-25 → 25 Sep 2026
*/
export function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

/*
  Formats timestamp values stored by Supabase.
  Example: 2026-09-25T12:30:00Z → 25 Sep 2026, 05:30 PM
*/
export function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/*
  Converts database values into readable labels.
  Example: "out_of_stock" → "Out Of Stock"
*/
export function titleCase(value) {
  if (!value) {
    return "";
  }

  return String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\w\S*/g, (word) => {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
}

/*
  Makes a URL-safe slug from a product/category/collection name.
  Example: "Baby's Winter Set!" → "babys-winter-set"
*/
export function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/*
  Creates initials for admin avatar fallback.
  Example: "Kiddistan Admin" → "KA"
*/
export function getInitials(value) {
  if (!value) {
    return "KA";
  }

  return String(value)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}