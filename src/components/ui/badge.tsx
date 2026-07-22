import * as React from "react";

import { cn } from "@/lib/utils";

const Badge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "secondary" | "outline" | "success" | "warning";
  }
>(({ className, variant = "default", ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variant === "default" &&
          "border-transparent bg-primary text-primary-foreground",
        variant === "secondary" &&
          "border-transparent bg-secondary text-secondary-foreground",
        variant === "outline" && "text-foreground",
        variant === "success" &&
          "border-transparent bg-emerald-100 text-emerald-900",
        variant === "warning" &&
          "border-transparent bg-amber-100 text-amber-950",
        className,
      )}
      {...props}
    />
  );
});
Badge.displayName = "Badge";

export { Badge };
