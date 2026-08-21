import type { Activity, Dog, Food, Goal, LifeStage } from "./types";

/** 安静時エネルギー要求量 RER = 70 × BW^0.75 */
export function rer(weightKg: number): number {
  if (!(weightKg > 0)) return 0;
  return 70 * Math.pow(weightKg, 0.75);
}

export function merFactor(opts: {
  lifeStage: LifeStage;
  activity: Activity;
  neutered: boolean;
  goal: Goal;
}): number {
  if (opts.lifeStage === "puppy_young") return 3.0;
  if (opts.lifeStage === "puppy") return 2.0;

  if (opts.goal === "lose") return 1.0;
  if (opts.goal === "gain") {
    if (opts.activity === "working" || opts.activity === "high") return 1.6;
    return 1.4;
  }

  if (opts.lifeStage === "senior") {
    if (opts.activity === "low") return 1.1;
    if (opts.activity === "high" || opts.activity === "working") return 1.6;
    return 1.3;
  }

  if (opts.activity === "working") return 2.5;
  if (opts.activity === "high") return 2.0;
  if (opts.activity === "low") return opts.neutered ? 1.2 : 1.4;
  return opts.neutered ? 1.6 : 1.8;
}

export function merFactorLabel(opts: {
  lifeStage: LifeStage;
  activity: Activity;
  neutered: boolean;
  goal: Goal;
}): string {
  if (opts.lifeStage === "puppy_young") return "成長期（〜4ヶ月）";
  if (opts.lifeStage === "puppy") return "成長期（4ヶ月〜）";
  if (opts.goal === "lose") return "減量";
  if (opts.goal === "gain") return "増量";
  if (opts.lifeStage === "senior") return "シニア";
  if (opts.activity === "working") return "ワーキング";
  if (opts.activity === "high") return "活発";
  if (opts.activity === "low") return opts.neutered ? "低活動・避妊去勢済" : "低活動";
  return opts.neutered ? "成犬・避妊去勢済" : "成犬・未去勢";
}

/** 計算に使う体重。減量は理想体重、それ以外は現在体重。 */
export function calcWeightKg(dog: Pick<Dog, "currentWeightKg" | "idealWeightKg" | "goal">): number {
  return dog.goal === "lose" ? dog.idealWeightKg : dog.currentWeightKg;
}

export function dailyTargetKcal(
  dog: Pick<
    Dog,
    | "currentWeightKg"
    | "idealWeightKg"
    | "lifeStage"
    | "activity"
    | "neutered"
    | "goal"
  >,
): number {
  const weight = calcWeightKg(dog);
  const value = rer(weight) * merFactor(dog);
  return Math.round(value);
}

export function unitLabel(unit: string | null | undefined): string {
  if (unit === "100g") return "100g";
  if (unit === "serving") return "1回分";
  if (unit === "piece") return "1個";
  return unit ?? "";
}

export function amountSuffix(unit: string | null | undefined): string {
  if (unit === "100g") return "g";
  if (unit === "serving") return "回分";
  if (unit === "piece") return "個";
  return "";
}

/** フードの数量からカロリーを算出 */
export function kcalFromAmount(food: Pick<Food, "kcal" | "unit">, amount: number): number {
  if (!(amount > 0)) return 0;
  if (food.unit === "100g") return (food.kcal * amount) / 100;
  return food.kcal * amount;
}

/** 目標カロリーから必要な数量を算出 */
export function amountFromKcal(food: Pick<Food, "kcal" | "unit">, kcal: number): number {
  if (!(food.kcal > 0) || !(kcal > 0)) return 0;
  if (food.unit === "100g") return (kcal / food.kcal) * 100;
  return kcal / food.kcal;
}

export function treatBudgetKcal(targetKcal: number, treatPct: number): number {
  const pct = Math.min(Math.max(treatPct, 0), 20);
  return Math.round(targetKcal * (pct / 100));
}

export function mealBudgetKcal(targetKcal: number, treatPct: number): number {
  return Math.max(0, targetKcal - treatBudgetKcal(targetKcal, treatPct));
}

export type WeightPace = {
  deltaKg: number;
  direction: "lose" | "gain" | "maintain";
  weeksMin: number | null;
  weeksMax: number | null;
  weeklyMinKg: number;
  weeklyMaxKg: number;
};

/** 理想体重までの目安期間（週1〜2%が安全域） */
export function weightPace(currentKg: number, idealKg: number): WeightPace {
  const delta = Math.round((idealKg - currentKg) * 100) / 100;
  if (Math.abs(delta) < 0.05) {
    return {
      deltaKg: 0,
      direction: "maintain",
      weeksMin: null,
      weeksMax: null,
      weeklyMinKg: 0,
      weeklyMaxKg: 0,
    };
  }
  const direction = delta < 0 ? "lose" : "gain";
  const abs = Math.abs(delta);
  const weeklyMinKg = currentKg * 0.01;
  const weeklyMaxKg = currentKg * 0.02;
  return {
    deltaKg: delta,
    direction,
    weeksMin: weeklyMaxKg > 0 ? abs / weeklyMaxKg : null,
    weeksMax: weeklyMinKg > 0 ? abs / weeklyMinKg : null,
    weeklyMinKg,
    weeklyMaxKg,
  };
}

export function formatAmount(amount: number, unit: string | null | undefined): string {
  if (!(amount > 0)) return "—";
  const suffix = amountSuffix(unit);
  const digits = unit === "100g" ? 0 : amount >= 10 ? 1 : 2;
  const n = Number(amount.toFixed(digits));
  return `${n.toLocaleString("ja-JP")}${suffix}`;
}
