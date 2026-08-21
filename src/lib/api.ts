import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { dailyTargetKcal } from "@/lib/calories";
import type {
  Activity,
  DaySummary,
  Dog,
  DogInput,
  Food,
  FoodInput,
  FoodKind,
  FoodUnit,
  Goal,
  LifeStage,
  LogEntry,
} from "@/lib/types";
import { parseNum } from "@/lib/utils";

type DogRow = {
  id: number;
  name: string;
  current_weight_kg: string | number;
  ideal_weight_kg: string | number;
  life_stage: string;
  activity: string;
  neutered: boolean;
  goal: string;
  meals_per_day: number;
  treat_pct: string | number;
  target_kcal: number;
};

type FoodRow = {
  id: number;
  name: string;
  kind: string;
  kcal: string | number;
  unit: string;
};

type LogRow = {
  id: number;
  dog_id: number;
  log_date: string;
  name: string;
  kind: string;
  kcal: string | number;
  amount: string | number | null;
  unit: string | null;
  food_id: number | null;
  created_at: string | Date;
};

type DayRow = {
  log_date: string;
  total_kcal: string | number;
  meal_kcal: string | number;
  treat_kcal: string | number;
  entry_count: number;
};

function mapDog(row: DogRow): Dog {
  return {
    id: row.id,
    name: row.name,
    currentWeightKg: parseNum(row.current_weight_kg),
    idealWeightKg: parseNum(row.ideal_weight_kg),
    lifeStage: row.life_stage as LifeStage,
    activity: row.activity as Activity,
    neutered: Boolean(row.neutered),
    goal: row.goal as Goal,
    mealsPerDay: Number(row.meals_per_day) || 2,
    treatPct: parseNum(row.treat_pct),
    targetKcal: Number(row.target_kcal),
  };
}

function mapFood(row: FoodRow): Food {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind as FoodKind,
    kcal: parseNum(row.kcal),
    unit: row.unit as FoodUnit,
  };
}

function mapEntry(row: LogRow): LogEntry {
  return {
    id: row.id,
    dogId: row.dog_id,
    logDate: String(row.log_date).slice(0, 10),
    name: row.name,
    kind: row.kind as FoodKind,
    kcal: parseNum(row.kcal),
    amount: row.amount == null ? null : parseNum(row.amount),
    unit: row.unit,
    foodId: row.food_id,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  };
}

function sanitizeDog(input: DogInput): DogInput {
  const name = input.name.trim();
  if (!name) throw new Error("名前を入力してください");
  if (!(input.currentWeightKg > 0) || input.currentWeightKg > 120) {
    throw new Error("現在の体重を正しく入力してください");
  }
  if (!(input.idealWeightKg > 0) || input.idealWeightKg > 120) {
    throw new Error("理想体重を正しく入力してください");
  }
  const meals = Math.round(input.mealsPerDay);
  if (meals < 1 || meals > 4) throw new Error("食事回数は1〜4回です");
  const treatPct = Math.min(Math.max(input.treatPct, 0), 20);
  return {
    ...input,
    name,
    currentWeightKg: Math.round(input.currentWeightKg * 100) / 100,
    idealWeightKg: Math.round(input.idealWeightKg * 100) / 100,
    mealsPerDay: meals,
    treatPct,
  };
}

export const getDog = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<DogRow>`
      select id, name, current_weight_kg, ideal_weight_kg, life_stage, activity,
             neutered, goal, meals_per_day, treat_pct, target_kcal
      from dogs
      where user_id = ${context.userId}
      order by id asc
      limit 1
    `;
    return rows[0] ? mapDog(rows[0]) : null;
  });

export const saveDog = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: DogInput) => sanitizeDog(input))
  .handler(async ({ context, data }) => {
    const target = dailyTargetKcal(data);
    const sql = await getSql();
    const existing = await sql<{ id: number }>`
      select id from dogs where user_id = ${context.userId} order by id asc limit 1
    `;
    if (existing[0]) {
      const rows = await sql<DogRow>`
        update dogs set
          name = ${data.name},
          current_weight_kg = ${data.currentWeightKg},
          ideal_weight_kg = ${data.idealWeightKg},
          life_stage = ${data.lifeStage},
          activity = ${data.activity},
          neutered = ${data.neutered},
          goal = ${data.goal},
          meals_per_day = ${data.mealsPerDay},
          treat_pct = ${data.treatPct},
          target_kcal = ${target},
          updated_at = now()
        where id = ${existing[0].id} and user_id = ${context.userId}
        returning id, name, current_weight_kg, ideal_weight_kg, life_stage, activity,
                  neutered, goal, meals_per_day, treat_pct, target_kcal
      `;
      return mapDog(rows[0]);
    }
    const rows = await sql<DogRow>`
      insert into dogs (
        user_id, name, current_weight_kg, ideal_weight_kg, life_stage, activity,
        neutered, goal, meals_per_day, treat_pct, target_kcal
      ) values (
        ${context.userId}, ${data.name}, ${data.currentWeightKg}, ${data.idealWeightKg},
        ${data.lifeStage}, ${data.activity}, ${data.neutered}, ${data.goal},
        ${data.mealsPerDay}, ${data.treatPct}, ${target}
      )
      returning id, name, current_weight_kg, ideal_weight_kg, life_stage, activity,
                neutered, goal, meals_per_day, treat_pct, target_kcal
    `;
    return mapDog(rows[0]);
  });

export const listFoods = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<FoodRow>`
      select id, name, kind, kcal, unit
      from foods
      where user_id = ${context.userId}
      order by kind asc, name asc
    `;
    return rows.map(mapFood);
  });

export const addFood = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: FoodInput) => {
    const name = input.name.trim();
    if (!name) throw new Error("フード名を入力してください");
    if (!(input.kcal > 0) || input.kcal > 20000) {
      throw new Error("カロリーを正しく入力してください");
    }
    if (input.kind !== "meal" && input.kind !== "treat") {
      throw new Error("種類が不正です");
    }
    if (!["100g", "serving", "piece"].includes(input.unit)) {
      throw new Error("単位が不正です");
    }
    return { ...input, name, kcal: Math.round(input.kcal * 10) / 10 };
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<FoodRow>`
      insert into foods (user_id, name, kind, kcal, unit)
      values (${context.userId}, ${data.name}, ${data.kind}, ${data.kcal}, ${data.unit})
      returning id, name, kind, kcal, unit
    `;
    return mapFood(rows[0]);
  });

export const deleteFood = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: number) => id)
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    await sql`
      delete from foods where id = ${id} and user_id = ${context.userId}
    `;
    return { ok: true };
  });

type AddEntryInput = {
  dogId: number;
  logDate: string;
  name: string;
  kind: FoodKind;
  kcal: number;
  amount?: number | null;
  unit?: string | null;
  foodId?: number | null;
};

export const listEntries = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: { dogId: number; logDate: string }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<LogRow>`
      select id, dog_id, log_date, name, kind, kcal, amount, unit, food_id, created_at
      from log_entries
      where user_id = ${context.userId}
        and dog_id = ${data.dogId}
        and log_date = ${data.logDate}::date
      order by created_at desc, id desc
    `;
    return rows.map(mapEntry);
  });

export const addEntry = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: AddEntryInput) => {
    const name = input.name.trim() || (input.kind === "treat" ? "おやつ" : "ごはん");
    if (!(input.kcal > 0) || input.kcal > 20000) {
      throw new Error("カロリーを正しく入力してください");
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.logDate)) {
      throw new Error("日付が不正です");
    }
    return {
      ...input,
      name,
      kcal: Math.round(input.kcal * 10) / 10,
      amount: input.amount ?? null,
      unit: input.unit ?? null,
      foodId: input.foodId ?? null,
    };
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const owned = await sql<{ id: number }>`
      select id from dogs where id = ${data.dogId} and user_id = ${context.userId}
    `;
    if (!owned[0]) throw new Error("愛犬が見つかりません");
    const rows = await sql<LogRow>`
      insert into log_entries (
        user_id, dog_id, log_date, name, kind, kcal, amount, unit, food_id
      ) values (
        ${context.userId}, ${data.dogId}, ${data.logDate}::date, ${data.name},
        ${data.kind}, ${data.kcal}, ${data.amount}, ${data.unit}, ${data.foodId}
      )
      returning id, dog_id, log_date, name, kind, kcal, amount, unit, food_id, created_at
    `;
    return mapEntry(rows[0]);
  });

export const deleteEntry = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: number) => id)
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    await sql`
      delete from log_entries where id = ${id} and user_id = ${context.userId}
    `;
    return { ok: true };
  });

export const weekSummary = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: { dogId: number; endDate: string }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<DayRow>`
      select
        log_date,
        coalesce(sum(kcal), 0) as total_kcal,
        coalesce(sum(case when kind = 'meal' then kcal else 0 end), 0) as meal_kcal,
        coalesce(sum(case when kind = 'treat' then kcal else 0 end), 0) as treat_kcal,
        count(*)::int as entry_count
      from log_entries
      where user_id = ${context.userId}
        and dog_id = ${data.dogId}
        and log_date > (${data.endDate}::date - interval '6 days')
        and log_date <= ${data.endDate}::date
      group by log_date
      order by log_date asc
    `;
    return rows.map(
      (row): DaySummary => ({
        date: String(row.log_date).slice(0, 10),
        totalKcal: parseNum(row.total_kcal),
        mealKcal: parseNum(row.meal_kcal),
        treatKcal: parseNum(row.treat_kcal),
        count: Number(row.entry_count),
      }),
    );
  });
