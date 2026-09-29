import React from "react";
import { cn } from "@/lib/utils";

export const Label = React.forwardRef(function Label(
  { className, children, ...props },
  ref
) {
  return (
    <label
      ref={ref}
      className={cn(
        "block text-[13px] font-medium leading-none text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
});

Label.displayName = "Label";