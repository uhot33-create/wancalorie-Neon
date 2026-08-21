import { createFileRoute } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Segmented } from "@/components/dog-form";
import { AppShell } from "@/components/app-shell";
import { AuthGate } from "@/components/auth-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { addFood, deleteFood, listFoods } from "@/lib/api";
import { unitLabel } from "@/lib/calories";
import type { Food, FoodInput, FoodKind, FoodUnit } from "@/lib/types";
import { formatKcal } from "@/lib/utils";

export const Route = createFileRoute("/foods")({ component: FoodsPage });

const SUGGESTIONS: FoodInput[] = [
  { name: "ドライフード", kind: "meal", kcal: 360, unit: "100g" },
  { name: "ウェットフード", kind: "meal", kcal: 90, unit: "100g" },
  { name: "ささみジャーキー", kind: "treat", kcal: 8, unit: "piece" },
  { name: "チーズ", kind: "treat", kcal: 15, unit: "piece" },
];

function FoodsPage() {
  return (
    <AuthGate>
      <FoodsView />
    </AuthGate>
  );
}

function FoodsView() {
  const [foods, setFoods] = useState<Food[] | undefined>(undefined);

  const load = useCallback(async () => {
    try {
      setFoods(await listFoods());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "読み込みに失敗しました");
      setFoods([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (foods === undefined) {
    return (
      <AppShell>
        <Skeleton className="h-56 rounded-xl" />
      </AppShell>
    );
  }

  const meals = foods.filter((f) => f.kind === "meal");
  const treats = foods.filter((f) => f.kind === "treat");

  return (
    <AppShell title="フード帳">
      <header className="mb-5">
        <h1 className="font-display text-2xl font-semibold">よく使うフード</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          登録すると、今日の足し算とプランの給与量計算に使えます。
        </p>
      </header>

      <Card className="p-5">
        <h2 className="font-display text-base font-semibold">追加する</h2>
        <FoodCreateForm
          onCreated={async () => {
            await load();
          }}
        />
      </Card>

      {foods.length === 0 && (
        <section className="mt-5">
          <p className="mb-2 text-sm text-muted">よくある例から追加</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.name}
                type="button"
                onClick={async () => {
                  try {
                    await addFood({ data: s });
                    toast.success(`${s.name} を追加しました`);
                    await load();
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "追加できませんでした");
                  }
                }}
                className="rounded-full border border-border bg-surface px-3 py-2 text-xs hover:bg-surface-2"
              >
                {s.name}
              </button>
            ))}
          </div>
        </section>
      )}

      <FoodGroup title="ごはん" items={meals} onChange={load} />
      <FoodGroup title="おやつ" items={treats} onChange={load} />
    </AppShell>
  );
}

function FoodCreateForm({ onCreated }: { onCreated: () => Promise<void> }) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<FoodKind>("meal");
  const [unit, setUnit] = useState<FoodUnit>("100g");
  const [kcal, setKcal] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await addFood({
        data: { name, kind, unit, kcal: Number(kcal) },
      });
      setName("");
      setKcal("");
      toast.success("追加しました");
      await onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "追加できませんでした");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <Segmented
        value={kind}
        onChange={(v) => {
          const next = v as FoodKind;
          setKind(next);
          setUnit(next === "treat" ? "piece" : "100g");
        }}
        options={[
          { value: "meal", label: "ごはん" },
          { value: "treat", label: "おやつ" },
        ]}
      />
      <div className="space-y-1.5">
        <Label htmlFor="food-name">名前</Label>
        <Input
          id="food-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={kind === "treat" ? "ささみジャーキー" : "いつものドライ"}
          required
          autoComplete="off"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="food-kcal">カロリー</Label>
          <Input
            id="food-kcal"
            type="number"
            inputMode="decimal"
            min={0.1}
            step={0.1}
            value={kcal}
            onChange={(e) => setKcal(e.target.value)}
            placeholder="360"
            required
            className="tabular-nums"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="food-unit">単位</Label>
          <select
            id="food-unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value as FoodUnit)}
            className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
          >
            <option value="100g">100g あたり</option>
            <option value="serving">1回分</option>
            <option value="piece">1個</option>
          </select>
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "追加中…" : "フード帳に入れる"}
      </Button>
    </form>
  );
}

function FoodGroup({
  title,
  items,
  onChange,
}: {
  title: string;
  items: Food[];
  onChange: () => Promise<void>;
}) {
  if (items.length === 0) return null;
  return (
    <section className="mt-6">
      <h2 className="mb-2 font-display text-base font-semibold">{title}</h2>
      <ul className="space-y-2">
        {items.map((food) => (
          <li
            key={food.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5"
          >
            <Badge tone={food.kind === "treat" ? "warn" : "ok"}>
              {unitLabel(food.unit)}
            </Badge>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{food.name}</p>
              <p className="text-xs text-muted tabular-nums">
                {formatKcal(food.kcal)} kcal / {unitLabel(food.unit)}
              </p>
            </div>
            <button
              type="button"
              aria-label="削除"
              onClick={async () => {
                try {
                  await deleteFood({ data: food.id });
                  toast.success("削除しました");
                  await onChange();
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "削除できませんでした");
                }
              }}
              className="grid size-10 place-items-center rounded-md text-subtle hover:bg-surface-2 hover:text-danger"
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
