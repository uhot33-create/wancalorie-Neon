import type { ReactNode } from "react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/skeleton";

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();

  if (isPending) {
    return (
      <AppShell>
        <div className="space-y-4">
          <Skeleton className="mx-auto size-48 rounded-full" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </AppShell>
    );
  }

  if (!user) return <RedirectToSignIn />;
  return <>{children}</>;
}
