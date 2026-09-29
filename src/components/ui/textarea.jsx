"use client";

import React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef(function Textarea(
  { className, rows = 4, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        "flex min-h-24 w-full resize-y rounded-sm border border-border bg-card px-3 py-2 text-[13px] text-foreground shadow-soft outline-none transition-colors",
        "placeholder:text-muted-foreground",
        "focus:border-primary focus:ring-2 focus:ring-primary/15",
        "disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70",
        className
      )}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";