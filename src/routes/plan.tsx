import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { AuthGate } from "@/components/auth-gate";
import { Segmented } from "@/components/dog-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { getDog, listFoods, saveDog } from "@/lib/api";
import {
  amountFromKcal,
  calcWeightKg,
  dailyTargetKcal,
  formatAmount,
  mealBudgetKcal,
  merFactor,
  merFactorLabel,
  rer,
  treatBudgetKcal,
  unitLabel,
  weightPace,
} from "@/lib/calories";
import { GOALS, type Dog, type DogInput, type Food, type Goal } from "@/lib/types";
import { cn, formatKcal, formatKg } from "@/lib/utils";

export const Route = createFileRoute("/plan")({ component: PlanPage });

function PlanPage() {
  return (
    <AuthGate>
      <PlanView />
    </AuthGate>
  );
}

function PlanView() {
  const [dog, setDog] = useState<Dog | null | undefined>(undefined);
  const [foods, setFoods] = useState<Food[]>([]);
  const [mealId, setMealId] = useState<number | null>(null);
  const [treatId, setTreatId] = useState<number | null>(null);
  const [treatPct, setTreatPct] = useState(10);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [nextDog, nextFoods] = await Promise.all([getDog(), listFoods()]);
      setDog(nextDog);
      setFoods(nextFoods);
      if (nextDog) setTreatPct(nextDog.treatPct);
      const meals = nextFoods.filter((f) => f.kind === "meal");
      const treats = nextFoods.filter((f) => f.kind === "treat");
      setMealId((id) => id ?? meals[0]?.id ?? null);
      setTreatId((id) => id ?? treats[0]?.id ?? null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "読み込みに失敗しました");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const mealFoods = foods.filter((f) => f.kind === "meal");
  const treatFoods = foods.filter((f) => f.kind === "treat");
  const meal = mealFoods.find((f) => f.id === mealId) ?? null;
  const treat = treatFoods.find((f) => f.id === treatId) ?? null;

  const plan = useMemo(() => {
    if (!dog) return null;
    const target = dailyTargetKcal(dog);
    const usedWeight = calcWeightKg(dog);
    const rest = rer(usedWeight);
    const factor = merFactor(dog);
    const treatKcal = treatBudgetKcal(target, treatPct);
    const mealKcal = mealBudgetKcal(target, treatPct);
    const mealAmount = meal ? amountFromKcal(meal, mealKcal) : 0;
    const treatAmount = treat ? amountFromKcal(treat, treatKcal) : 0;
    const perMeal = dog.mealsPerDay > 0 ? mealAmount / dog.mealsPerDay : mealAmount;
    const pace = weightPace(dog.currentWeightKg, dog.idealWeightKg);
    return {
      target,
      usedWeight,
      rest,
      factor,
      treatKcal,
      mealKcal,
      mealAmount,
      treatAmount,
      perMeal,
      pace,
    };
  }, [dog, meal, treat, treatPct]);

  if (dog === undefined) {
    return (
      <AppShell>
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </AppShell>
    );
  }

  if (!dog || !plan) {
    return (
      <AppShell title="プラン">
        <Card className="py-10 text-center">
          <p className="text-sm text-muted">先に愛犬のプロフィールを登録してください</p>
          <Button asChild className="mt-4">
            <Link to="/dog">プロフィールへ</Link>
          </Button>
        </Card>
      </AppShell>
    );
  }

  async function persistPlan(patch: Partial<DogInput>) {
    if (!dog) return;
    const next: DogInput = {
      name: dog.name,
      currentWeightKg: dog.currentWeightKg,
      idealWeightKg: dog.idealWeightKg,
      lifeStage: dog.lifeStage,
      activity: dog.activity,
      neutered: dog.neutered,
      goal: dog.goal,
      mealsPerDay: dog.mealsPerDay,
      treatPct,
      ...patch,
    };
    if (patch.treatPct != null) setTreatPct(patch.treatPct);
    setSaving(true);
    try {
      const saved = await saveDog({ data: next });
      setDog(saved);
      toast.success("プランを保存しました");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  async function persistTreatPct(next: number) {
    if (!dog) return;
    setTreatPct(next);
    setSaving(true);
    try {
      const saved = await saveDog({
        data: {
          name: dog.name,
          currentWeightKg: dog.currentWeightKg,
          idealWeightKg: dog.idealWeightKg,
          lifeStage: dog.lifeStage,
          activity: dog.activity,
          neutered: dog.neutered,
          goal: dog.goal,
          mealsPerDay: dog.mealsPerDay,
          treatPct: next,
        },
      });
      setDog(saved);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  const treatOver = treatPct > 10.05;

  return (
    <AppShell title={dog.name} subtitle="必要カロリー">
      <header className="mb-5">
        <h1 className="font-display text-2xl font-semibold">理想体重プラン</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          いまの体と目標から1日の必要量を出し、ごはんとおやつに分けます。
        </p>
      </header>

      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted">1日の必要カロリー</p>
            <p className="mt-1 font-display text-4xl font-semibold tabular-nums tracking-tight">
              {formatKcal(plan.target)}
              <span className="ml-1 text-base font-normal text-muted">kcal</span>
            </p>
          </div>
          <Badge tone={dog.goal === "lose" ? "warn" : dog.goal === "gain" ? "ok" : "neutral"}>
            {dog.goal === "lose" ? "減量" : dog.goal === "gain" ? "増量" : "維持"}
          </Badge>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <Row label="現在" value={`${formatKg(dog.currentWeightKg)} kg`} />
          <Row label="理想" value={`${formatKg(dog.idealWeightKg)} kg`} />
          <Row
            label="計算体重"
            value={`${formatKg(plan.usedWeight)} kg`}
            hint={dog.goal === "lose" ? "減量は理想体重で計算" : "現在体重で計算"}
          />
          <Row
            label="RER"
            value={`${formatKcal(plan.rest)} kcal`}
            hint="安静時エネルギー"
          />
          <Row
            label="係数"
            value={`× ${plan.factor.toFixed(1)}`}
            hint={merFactorLabel(dog)}
          />
          <Row label="食事回数" value={`1日 ${dog.mealsPerDay} 回`} />
        </dl>

        <PaceNote pace={plan.pace} />
      </Card>

      <section className="mt-6">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">プランを変更</h2>
          {saving && <span className="text-xs text-subtle">保存中</span>}
        </div>
        <p className="text-sm text-muted">
          目標や体重を変えると、上の必要カロリーがすぐ計算し直されます。
        </p>
        <Card className="mt-3 space-y-5 p-5">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-muted">目標</legend>
            <Segmented
              value={dog.goal}
              onChange={(v) => void persistPlan({ goal: v as Goal })}
              options={GOALS.map((g) => ({ value: g.value, label: g.label }))}
            />
          </fieldset>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="plan-current-kg">現在の体重 (kg)</Label>
              <Input
                id="plan-current-kg"
                type="number"
                inputMode="decimal"
                min={0.5}
                max={120}
                step={0.1}
                defaultValue={dog.currentWeightKg}
                key={`current-${dog.currentWeightKg}`}
                onBlur={(e) => {
                  const n = Number(e.target.value);
                  if (!Number.isFinite(n) || n < 0.5) return;
                  if (n === dog.currentWeightKg) return;
                  void persistPlan({ currentWeightKg: n });
                }}
                className="tabular-nums"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plan-ideal-kg">理想体重 (kg)</Label>
              <Input
                id="plan-ideal-kg"
                type="number"
                inputMode="decimal"
                min={0.5}
                max={120}
                step={0.1}
                defaultValue={dog.idealWeightKg}
                key={`ideal-${dog.idealWeightKg}`}
                onBlur={(e) => {
                  const n = Number(e.target.value);
                  if (!Number.isFinite(n) || n < 0.5) return;
                  if (n === dog.idealWeightKg) return;
                  void persistPlan({ idealWeightKg: n });
                }}
                className="tabular-nums"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan-meals">1日の食事回数</Label>
            <Segmented
              value={String(dog.mealsPerDay)}
              onChange={(v) => void persistPlan({ mealsPerDay: Number(v) })}
              options={[
                { value: "1", label: "1回" },
                { value: "2", label: "2回" },
                { value: "3", label: "3回" },
                { value: "4", label: "4回" },
              ]}
            />
          </div>
        </Card>
      </section>

      <section className="mt-6">
        <h2 className="font-display text-lg font-semibold">ごはんとおやつ</h2>
        <p className="mt-1 text-sm text-muted">
          おやつは全体の10%以内が目安です。登録したフードから量を計算します。
        </p>

        <Card className="mt-3 space-y-5 p-5">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label htmlFor="treat-range">おやつの割合 {treatPct}%</Label>
              {saving && <span className="text-xs text-subtle">保存中</span>}
            </div>
            <input
              id="treat-range"
              type="range"
              min={0}
              max={15}
              step={0.5}
              value={treatPct}
              onChange={(e) => setTreatPct(Number(e.target.value))}
              onPointerUp={(e) =>
                void persistTreatPct(Number((e.target as HTMLInputElement).value))
              }
              onBlur={(e) => void persistTreatPct(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="mt-1 flex justify-between text-[11px] text-subtle">
              <span>0%</span>
              <span>10% 目安</span>
              <span>15%</span>
            </div>
            {treatOver && (
              <p className="mt-2 text-xs text-warn">
                10%を超えています。主食の栄養バランスが崩れやすくなります。
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Budget
              label="ごはん"
              kcal={plan.mealKcal}
              share={`${Math.round(100 - treatPct)}%`}
            />
            <Budget label="おやつ" kcal={plan.treatKcal} share={`${treatPct}%`} warn={treatOver} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="meal-food">主食フード</Label>
            {mealFoods.length === 0 ? (
              <EmptyFood kind="meal" />
            ) : (
              <FoodSelect
                id="meal-food"
                foods={mealFoods}
                value={mealId}
                onChange={setMealId}
              />
            )}
            {meal && (
              <p className="text-sm text-fg">
                1日{" "}
                <span className="font-display text-xl font-semibold tabular-nums">
                  {formatAmount(plan.mealAmount, meal.unit)}
                </span>
                <span className="text-muted">
                  {" "}
                  （1回 {formatAmount(plan.perMeal, meal.unit)} × {dog.mealsPerDay}）
                </span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="treat-food">おやつ</Label>
            {treatFoods.length === 0 ? (
              <EmptyFood kind="treat" />
            ) : (
              <FoodSelect
                id="treat-food"
                foods={treatFoods}
                value={treatId}
                onChange={setTreatId}
              />
            )}
            {treat && plan.treatKcal > 0 && (
              <p className="text-sm text-fg">
                1日{" "}
                <span className="font-display text-xl font-semibold tabular-nums">
                  {formatAmount(plan.treatAmount, treat.unit)}
                </span>
                <span className="text-muted">
                  {" "}
                  （{formatKcal(treat.kcal)} kcal / {unitLabel(treat.unit)}）
                </span>
              </p>
            )}
            {treat && plan.treatKcal === 0 && (
              <p className="text-sm text-muted">おやつなしの設定です</p>
            )}
          </div>
        </Card>
      </section>

      <ManualCalc foods={foods} />

      <p className="mt-6 text-center text-xs leading-relaxed text-subtle">
        計算は一般的なRER / MER（70 × 体重^0.75 × 係数）です。病気や特別食がある場合は獣医師の指示を優先してください。
        体重や活動量の詳細は
        <Link to="/dog" className="mx-1 font-medium text-primary underline-offset-2 hover:underline">
          プロフィール
        </Link>
        からも変えられます。目標・体重・食事回数はこの画面の「プランを変更」から保存できます。
      </p>
    </AppShell>
  );
}

function Row({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium tabular-nums">{value}</dd>
      {hint && <p className="text-[11px] text-subtle">{hint}</p>}
    </div>
  );
}

function Budget({
  label,
  kcal,
  share,
  warn,
}: {
  label: string;
  kcal: number;
  share: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-md bg-surface-2 px-3 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold tabular-nums">
        {formatKcal(kcal)}
      </p>
      <p className={cn("text-xs", warn ? "text-warn" : "text-subtle")}>{share}</p>
    </div>
  );
}

function PaceNote({
  pace,
}: {
  pace: ReturnType<typeof weightPace>;
}) {
  if (pace.direction === "maintain") {
    return (
      <p className="mt-5 rounded-md bg-primary-soft px-3 py-2 text-sm text-primary">
        現在体重は理想体重の範囲です。維持カロリーで続けましょう。
      </p>
    );
  }
  const verb = pace.direction === "lose" ? "減らす" : "増やす";
  const weeks =
    pace.weeksMin != null && pace.weeksMax != null
      ? `およそ ${Math.max(1, Math.round(pace.weeksMin))}〜${Math.max(1, Math.round(pace.weeksMax))} 週間`
      : "—";
  return (
    <p className="mt-5 rounded-md bg-surface-2 px-3 py-2 text-sm leading-relaxed text-muted">
      {formatKg(Math.abs(pace.deltaKg))} kg {verb}目標。週1〜2%のペースなら
      {weeks}が目安です。
    </p>
  );
}

function FoodSelect({
  id,
  foods,
  value,
  onChange,
}: {
  id: string;
  foods: Food[];
  value: number | null;
  onChange: (id: number) => void;
}) {
  return (
    <select
      id={id}
      value={value ?? ""}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-11 w-full appearance-none rounded-md border border-border bg-surface px-3 pr-9 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
    >
      {foods.map((food) => (
        <option key={food.id} value={food.id}>
          {food.name} · {formatKcal(food.kcal)} kcal / {unitLabel(food.unit)}
        </option>
      ))}
    </select>
  );
}

function EmptyFood({ kind }: { kind: "meal" | "treat" }) {
  return (
    <p className="rounded-md border border-dashed border-border px-3 py-3 text-sm text-muted">
      {kind === "meal" ? "主食フード" : "おやつ"}が未登録です。
      <Link to="/foods" className="ml-1 font-medium text-primary underline-offset-2 hover:underline">
        フード帳に追加
      </Link>
    </p>
  );
}

function ManualCalc({ foods }: { foods: Food[] }) {
  const [kcalPer100, setKcalPer100] = useState("");
  const [grams, setGrams] = useState("80");
  const foodKcal = Number(kcalPer100);
  const g = Number(grams);
  const result = foodKcal > 0 && g > 0 ? (foodKcal * g) / 100 : 0;

  return (
    <section className="mt-6">
      <h2 className="font-display text-lg font-semibold">袋の表示から計算</h2>
      <p className="mt-1 text-sm text-muted">
        登録していないフードも、100gあたりのkcalとグラム数ですぐ出せます。
      </p>
      <Card className="mt-3 space-y-3 p-5">
        {foods.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {foods
              .filter((f) => f.unit === "100g")
              .slice(0, 6)
              .map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setKcalPer100(String(f.kcal))}
                  className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-surface-2"
                >
                  {f.name}
                </button>
              ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="kcal100">kcal / 100g</Label>
            <Input
              id="kcal100"
              type="number"
              inputMode="decimal"
              min={0}
              value={kcalPer100}
              onChange={(e) => setKcalPer100(e.target.value)}
              placeholder="380"
              className="tabular-nums"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="grams">給与量 (g)</Label>
            <Input
              id="grams"
              type="number"
              inputMode="decimal"
              min={0}
              value={grams}
              onChange={(e) => setGrams(e.target.value)}
              className="tabular-nums"
            />
          </div>
        </div>
        <p className="font-display text-2xl font-semibold tabular-nums">
          {result > 0 ? `${formatKcal(result)} kcal` : "—"}
        </p>
      </Card>
    </section>
  );
}
