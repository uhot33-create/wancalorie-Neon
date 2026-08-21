import { Link, useRouterState } from "@tanstack/react-router";
import { Bone, Calculator, PawPrint, UtensilsCrossed } from "lucide-react";
import type { ReactNode } from "react";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "今日", icon: UtensilsCrossed },
  { to: "/plan", label: "プラン", icon: Calculator },
  { to: "/foods", label: "フード", icon: Bone },
  { to: "/dog", label: "プロフィール", icon: PawPrint },
] as const;

export function AppShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isPending } = useCurrentUserState();

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold tracking-tight">
              わんカロリー
            </p>
            {(title || subtitle) && (
              <p className="truncate text-xs text-muted">
                {title}
                {subtitle ? ` · ${subtitle}` : ""}
              </p>
            )}
          </div>
          <div className="shrink-0">
            {isPending ? (
              <div className="size-8 animate-pulse rounded-full bg-surface-2" />
            ) : (
              <UserButton />
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg px-4 pb-32 pt-5">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
        <ul className="mx-auto grid max-w-lg grid-cols-4">
          {NAV.map((item) => {
            const active =
              item.to === "/"
                ? pathname === "/"
                : pathname === item.to || pathname.startsWith(`${item.to}/`);
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors duration-150",
                    active ? "text-primary" : "text-muted hover:text-fg",
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
