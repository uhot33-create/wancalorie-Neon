import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { authClient, GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { user, isPending } = useCurrentUserState();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (isPending) {
    return (
      <main className="grid min-h-dvh place-items-center bg-bg px-6">
        <div className="h-10 w-40 animate-pulse rounded-md bg-surface-2" />
      </main>
    );
  }
  if (user) return <Navigate to="/" />;

  const host =
    typeof window !== "undefined" ? window.location.hostname : "";
  const showGrokLogin =
    host.endsWith("grok-sandbox.com") || host.endsWith("grok.me");

  async function handleEmail(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") {
        const { error: err } = await authClient.signUp.email({
          email,
          password,
          name: name.trim() || email.split("@")[0] || "飼い主",
        });
        if (err) throw new Error(err.message || "登録に失敗しました");
      } else {
        const { error: err } = await authClient.signIn.email({ email, password });
        if (err) throw new Error(err.message || "ログインに失敗しました");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "ログインに失敗しました");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-6 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <PawMark />
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
            わんカロリー
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            愛犬の1日のカロリーを、かんたんに足し算。
            <br />
            理想体重に向けたごはんとおやつも計算します。
          </p>
        </div>

        {authEnabled ? (
          <div className="space-y-3">
            {showGrokLogin &&
              GROK_PROVIDERS.map((p) => (
                <Button
                  key={p.providerId}
                  variant="outline"
                  className="w-full"
                  size="lg"
                  onClick={() => void signIn(p.providerId, { callbackURL: "/" })}
                >
                  {p.label} で続ける
                </Button>
              ))}

            {showGrokLogin && (
              <div className="flex items-center gap-3 py-2">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs text-subtle">またはメール</span>
                <span className="h-px flex-1 bg-border" />
              </div>
            )}

            <form onSubmit={(e) => void handleEmail(e)} className="space-y-3">
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label htmlFor="name">お名前</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    placeholder="山田 太郎"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">メール</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">パスワード</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  minLength={8}
                  required
                />
              </div>
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button type="submit" className="w-full" size="lg" disabled={busy}>
                {busy ? "処理中…" : mode === "signup" ? "新規登録" : "メールでログイン"}
              </Button>
            </form>

            <button
              type="button"
              onClick={() => {
                setMode((m) => (m === "signup" ? "signin" : "signup"));
                setError(null);
              }}
              className="w-full py-2 text-sm text-muted hover:text-fg"
            >
              {mode === "signup"
                ? "すでにアカウントがある方はログイン"
                : "はじめての方は新規登録"}
            </button>

            <a
              href="/wancalorie-Neon-source.zip"
              download="wancalorie-Neon-source.zip"
              className="block pt-2 text-center text-sm text-muted underline-offset-4 hover:text-fg hover:underline"
            >
              ソースをダウンロード
            </a>
          </div>
        ) : (
          <p className="text-center text-sm text-muted">サインインは無効です。</p>
        )}
      </div>
    </main>
  );
}

function PawMark() {
  return (
    <svg
      viewBox="0 0 72 72"
      className="mx-auto size-14 text-primary"
      aria-hidden="true"
    >
      <rect width="72" height="72" rx="18" fill="currentColor" />
      <ellipse cx="36" cy="46" rx="12" ry="10" fill="var(--color-bg)" />
      <circle cx="20" cy="30" r="6.2" fill="var(--color-bg)" />
      <circle cx="52" cy="30" r="6.2" fill="var(--color-bg)" />
      <circle cx="27" cy="21" r="5.2" fill="var(--color-bg)" />
      <circle cx="45" cy="21" r="5.2" fill="var(--color-bg)" />
    </svg>
  );
}
