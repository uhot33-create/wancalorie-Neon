export const LIFE_STAGES = [
  { value: "puppy_young", label: "子犬（生後4ヶ月未満）" },
  { value: "puppy", label: "子犬（4ヶ月〜成犬）" },
  { value: "adult", label: "成犬" },
  { value: "senior", label: "シニア" },
] as const;

export const ACTIVITIES = [
  { value: "low", label: "低め・室内中心" },
  { value: "moderate", label: "ふつう" },
  { value: "high", label: "活発" },
  { value: "working", label: "ワーキング・激しい運動" },
] as const;

export const GOALS = [
  { value: "lose", label: "減量" },
  { value: "maintain", label: "維持" },
  { value: "gain", label: "増量" },
] as const;

export type LifeStage = (typeof LIFE_STAGES)[number]["value"];
export type Activity = (typeof ACTIVITIES)[number]["value"];
export type Goal = (typeof GOALS)[number]["value"];
export type FoodKind = "meal" | "treat";
export type FoodUnit = "100g" | "serving" | "piece";

export type Dog = {
  id: number;
  name: string;
  currentWeightKg: number;
  idealWeightKg: number;
  lifeStage: LifeStage;
  activity: Activity;
  neutered: boolean;
  goal: Goal;
  mealsPerDay: number;
  treatPct: number;
  targetKcal: number;
};

export type DogInput = Omit<Dog, "id" | "targetKcal">;

export type Food = {
  id: number;
  name: string;
  kind: FoodKind;
  kcal: number;
  unit: FoodUnit;
};

export type FoodInput = Omit<Food, "id">;

export type LogEntry = {
  id: number;
  dogId: number;
  logDate: string;
  name: string;
  kind: FoodKind;
  kcal: number;
  amount: number | null;
  unit: string | null;
  foodId: number | null;
  createdAt: string;
};

export type DaySummary = {
  date: string;
  totalKcal: number;
  mealKcal: number;
  treatKcal: number;
  count: number;
};
