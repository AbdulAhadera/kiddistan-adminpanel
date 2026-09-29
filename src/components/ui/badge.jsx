import React from "react";
import { cn } from "@/lib/utils";

const toneClasses = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
  accent: "bg-accent/15 text-accent",
};

export function Badge({ className, tone = "default", children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium leading-4",
        toneClasses[tone] || toneClasses.default,
        className
      )}
    >
      {children}
    </span>
  );
}