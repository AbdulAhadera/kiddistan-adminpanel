"use client";

import React from "react";
import { cn } from "@/lib/utils";

const variantClasses = {
  default:
    "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-primary",
  outline:
    "border border-border bg-card text-foreground hover:bg-muted focus-visible:ring-primary",
  ghost:
    "text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-primary",
  destructive:
    "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive",
  link:
    "h-auto px-0 text-primary underline-offset-4 hover:underline focus-visible:ring-primary",
};

const sizeClasses = {
  default: "h-9 px-3.5 text-[13px]",
  sm: "h-8 px-3 text-xs",
  lg: "h-10 px-4 text-sm",
  icon: "h-9 w-9 p-0",
  "icon-sm": "h-8 w-8 p-0",
};

export const Button = React.forwardRef(function Button(
  {
    className,
    variant = "default",
    size = "default",
    type = "button",
    loading = false,
    disabled = false,
    children,
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-sm font-medium whitespace-nowrap transition-colors",
        "outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        variantClasses[variant] || variantClasses.default,
        sizeClasses[size] || sizeClasses.default,
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <span
            aria-hidden="true"
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
          <span>Saving...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
});

Button.displayName = "Button";