import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "ok" | "warn" | "danger";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tone === "neutral" && "bg-surface-2 text-muted",
        tone === "ok" && "bg-primary-soft text-primary",
        tone === "warn" && "bg-warn/15 text-warn",
        tone === "danger" && "bg-danger/12 text-danger",
        className,
      )}
      {...props}
    />
  );
}
