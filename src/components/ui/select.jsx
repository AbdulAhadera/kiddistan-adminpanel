"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef(function Select(
  { className, children, ...props },
  ref
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "flex h-9 w-full appearance-none rounded-sm border border-border bg-card px-3 py-2 pr-9 text-[13px] text-foreground shadow-soft outline-none transition-colors",
          "focus:border-primary focus:ring-2 focus:ring-primary/15",
          "disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70",
          className
        )}
        {...props}
      >
        {children}
      </select>

      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
});

Select.displayName = "Select";