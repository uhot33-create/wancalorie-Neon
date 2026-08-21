import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { AuthGate } from "@/components/auth-gate";
import { DogForm } from "@/components/dog-form";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getDog, saveDog } from "@/lib/api";
import { dailyTargetKcal, merFactorLabel, rer } from "@/lib/calories";
import type { Dog, DogInput } from "@/lib/types";
import { formatKcal, formatKg } from "@/lib/utils";

export const Route = createFileRoute("/dog")({ component: DogPage });

function DogPage() {
  return (
    <AuthGate>
      <DogView />
    </AuthGate>
  );
}

function DogView() {
  const [dog, setDog] = useState<Dog | null | undefined>(undefined);

  const load = useCallback(async () => {
    try {
      setDog(await getDog());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "読み込みに失敗しました");
      setDog(null);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (dog === undefined) {
    return (
      <AppShell>
        <Skeleton className="h-96 rounded-xl" />
      </AppShell>
    );
  }

  async function handleSave(input: DogInput) {
    const saved = await saveDog({ data: input });
    setDog(saved);
    toast.success("保存しました");
  }

  const preview = dog ?? {
    currentWeightKg: 8,
    idealWeightKg: 7,
    lifeStage: "adult" as const,
    activity: "moderate" as const,
    neutered: true,
    goal: "lose" as const,
  };
  const target = dailyTargetKcal(preview);

  return (
    <AppShell title={dog?.name ?? "プロフィール"}>
      <header className="mb-5">
        <h1 className="font-display text-2xl font-semibold">
          {dog ? `${dog.name} の設定` : "愛犬を登録"}
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          体重と生活から、今日の目標カロリーが決まります。
        </p>
      </header>

      {dog && (
        <Card className="mb-5 p-4">
          <p className="text-xs font-medium text-muted">いまの目標</p>
          <p className="mt-1 font-display text-3xl font-semibold tabular-nums">
            {formatKcal(target)}
            <span className="ml-1 text-base font-normal text-muted">kcal / 日</span>
          </p>
          <p className="mt-2 text-xs text-subtle">
            RER {formatKcal(rer(dog.goal === "lose" ? dog.idealWeightKg : dog.currentWeightKg))}
            {" · "}
            {merFactorLabel(dog)}
            {" · "}
            {formatKg(dog.currentWeightKg)} → {formatKg(dog.idealWeightKg)} kg
          </p>
        </Card>
      )}

      <Card className="p-5">
        <DogForm
          key={dog?.id ?? "new"}
          dog={dog}
          submitLabel={dog ? "変更を保存" : "登録する"}
          onSave={handleSave}
        />
      </Card>
    </AppShell>
  );
}
