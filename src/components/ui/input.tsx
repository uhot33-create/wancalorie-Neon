import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  type = "text",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        "h-11 w-full rounded-md border border-border bg-surface px-3 text-base text-fg shadow-none outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-subtle focus:border-primary/50 focus:ring-2 focus:ring-primary/20 disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
