import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Segmented } from "@/components/dog-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addEntry } from "@/lib/api";
import { kcalFromAmount, unitLabel } from "@/lib/calories";
import type { Food, FoodKind } from "@/lib/types";
import { cn, formatKcal } from "@/lib/utils";

const QUICK = [10, 25, 50, 100];

export function AddEntry({
  dogId,
  logDate,
  foods,
  onAdded,
}: {
  dogId: number;
  logDate: string;
  foods: Food[];
  onAdded: () => Promise<void> | void;
}) {
  const [kind, setKind] = useState<FoodKind>("meal");
  const [name, setName] = useState("");
  const [kcal, setKcal] = useState("");
  const [amount, setAmount] = useState("");
  const [foodId, setFoodId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const selected = foods.find((f) => f.id === foodId) ?? null;
  const visibleFoods = useMemo(
    () => foods.filter((f) => f.kind === kind).slice(0, 8),
    [foods, kind],
  );

  function pickFood(food: Food) {
    if (foodId === food.id) {
      setFoodId(null);
      return;
    }
    setFoodId(food.id);
    setName(food.name);
    setKind(food.kind);
    if (food.unit === "100g") {
      setAmount("20");
      setKcal(String(Math.round(kcalFromAmount(food, 20))));
    } else {
      setAmount("1");
      setKcal(String(food.kcal));
    }
  }

  function bump(delta: number) {
    const next = Math.max(0, (Number(kcal) || 0) + delta);
    setKcal(String(next));
  }

  function onAmountChange(value: string) {
    setAmount(value);
    if (selected) {
      const n = Number(value);
      if (n > 0) setKcal(String(Math.round(kcalFromAmount(selected, n) * 10) / 10));
    }
  }

  async function submit() {
    const value = Number(kcal);
    if (!(value > 0)) {
      toast.error("カロリーを入力してください");
      return;
    }
    setBusy(true);
    try {
      await addEntry({
        data: {
          dogId,
          logDate,
          name: name.trim() || (kind === "treat" ? "おやつ" : "ごはん"),
          kind,
          kcal: value,
          amount: amount ? Number(amount) : null,
          unit: selected?.unit ?? null,
          foodId,
        },
      });
      setName("");
      setKcal("");
      setAmount("");
      setFoodId(null);
      toast.success(`${formatKcal(value)} kcal を足しました`);
      await onAdded();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "追加できませんでした");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold">カロリーを足す</h2>
        <p className="text-xs text-muted">名前は省略できます</p>
      </div>

      <Segmented
        value={kind}
        onChange={(v) => {
          setKind(v as FoodKind);
          setFoodId(null);
        }}
        options={[
          { value: "meal", label: "ごはん" },
          { value: "treat", label: "おやつ" },
        ]}
      />

      {visibleFoods.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {visibleFoods.map((food) => {
            const active = food.id === foodId;
            return (
              <button
                key={food.id}
                type="button"
                onClick={() => pickFood(food)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-2 text-xs font-medium transition-colors duration-150",
                  active
                    ? "border-primary bg-primary text-primary-fg"
                    : "border-border bg-surface text-muted hover:bg-surface-2 hover:text-fg",
                )}
              >
                {food.name}
                <span className="ml-1 opacity-70">
                  {formatKcal(food.kcal)}/{unitLabel(food.unit)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-3 grid grid-cols-[1fr_7rem] gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={kind === "treat" ? "おやつ名（任意）" : "ごはん名（任意）"}
          autoComplete="off"
        />
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          step={1}
          value={kcal}
          onChange={(e) => setKcal(e.target.value)}
          placeholder="kcal"
          className="text-center font-medium tabular-nums"
        />
      </div>

      {selected && (
        <div className="mt-2">
          <label className="sr-only" htmlFor="amount">
            量
          </label>
          <div className="flex items-center gap-2">
            <Input
              id="amount"
              type="number"
              inputMode="decimal"
              min={0}
              step={selected.unit === "100g" ? 5 : 1}
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              className="max-w-28 tabular-nums"
            />
            <span className="text-sm text-muted">
              {selected.unit === "100g" ? "g" : unitLabel(selected.unit)}
            </span>
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => bump(n)}
            className="h-10 min-w-14 rounded-md border border-border bg-surface-2 px-3 text-sm font-medium tabular-nums text-fg hover:bg-border"
          >
            +{n}
          </button>
        ))}
      </div>

      <Button className="mt-3 w-full" size="lg" onClick={() => void submit()} disabled={busy}>
        <Plus className="size-4" />
        {busy ? "追加中…" : "足す"}
      </Button>
    </section>
  );
}
