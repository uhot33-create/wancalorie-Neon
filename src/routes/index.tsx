import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AddEntry } from "@/components/add-entry";
import { AppShell } from "@/components/app-shell";
import { AuthGate } from "@/components/auth-gate";
import { CalorieRing } from "@/components/calorie-ring";
import { DogForm } from "@/components/dog-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  deleteEntry,
  getDog,
  listEntries,
  listFoods,
  saveDog,
  weekSummary,
} from "@/lib/api";
import { amountSuffix } from "@/lib/calories";
import type { DaySummary, Dog, DogInput, Food, LogEntry } from "@/lib/types";
import {
  cn,
  formatJaDate,
  formatKcal,
  shiftDate,
  todayJst,
} from "@/lib/utils";

export const Route = createFileRoute("/")({ component: HomePage });

function HomePage() {
  return (
    <AuthGate>
      <TodayView />
    </AuthGate>
  );
}

function TodayView() {
  const [date, setDate] = useState(todayJst);
  const [dog, setDog] = useState<Dog | null | undefined>(undefined);
  const [foods, setFoods] = useState<Food[]>([]);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [week, setWeek] = useState<DaySummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (logDate: string) => {
    setLoading(true);
    try {
      const nextDog = await getDog();
      setDog(nextDog);
      if (!nextDog) {
        setEntries([]);
        setFoods([]);
        setWeek([]);
        return;
      }
      const [nextFoods, nextEntries, nextWeek] = await Promise.all([
        listFoods(),
        listEntries({ data: { dogId: nextDog.id, logDate } }),
        weekSummary({ data: { dogId: nextDog.id, endDate: logDate } }),
      ]);
      setFoods(nextFoods);
      setEntries(nextEntries);
      setWeek(nextWeek);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setEntries([]);
    void load(date);
  }, [date, load]);

  async function refresh() {
    if (!dog) return;
    const [nextEntries, nextWeek] = await Promise.all([
      listEntries({ data: { dogId: dog.id, logDate: date } }),
      weekSummary({ data: { dogId: dog.id, endDate: date } }),
    ]);
    setEntries(nextEntries);
    setWeek(nextWeek);
  }

  async function handleSaveDog(input: DogInput) {
    const saved = await saveDog({ data: input });
    setDog(saved);
    await load(date);
  }

  if (dog === undefined || (loading && dog === undefined)) {
    return (
      <AppShell>
        <div className="space-y-4">
          <Skeleton className="mx-auto size-56 rounded-full" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </AppShell>
    );
  }

  if (!dog) {
    return (
      <AppShell title="はじめまして">
        <Card className="p-5">
          <h1 className="font-display text-2xl font-semibold">愛犬を登録</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            体重と活動量から1日の必要カロリーを計算します。あとからいつでも変えられます。
          </p>
          <div className="mt-6">
            <DogForm submitLabel="はじめる" onSave={handleSaveDog} />
          </div>
        </Card>
      </AppShell>
    );
  }

  const mealKcal = entries
    .filter((e) => e.kind === "meal")
    .reduce((s, e) => s + e.kcal, 0);
  const treatKcal = entries
    .filter((e) => e.kind === "treat")
    .reduce((s, e) => s + e.kcal, 0);
  const total = mealKcal + treatKcal;
  const treatShare = total > 0 ? (treatKcal / dog.targetKcal) * 100 : 0;
  const isToday = date === todayJst();

  return (
    <AppShell title={dog.name}>
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setDate((d) => shiftDate(d, -1))}
          className="grid size-11 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
          aria-label="前日"
        >
          <ChevronLeft className="size-5" />
        </button>
        <div className="text-center">
          <p className="font-display text-lg font-semibold">{formatJaDate(date)}</p>
          {!isToday && (
            <button
              type="button"
              onClick={() => setDate(todayJst())}
              className="text-xs font-medium text-primary hover:underline"
            >
              今日に戻る
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setDate((d) => shiftDate(d, 1))}
          disabled={isToday}
          className="grid size-11 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-fg disabled:opacity-30"
          aria-label="翌日"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <CalorieRing current={total} target={dog.targetKcal} />

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat
          label="ごはん"
          value={`${formatKcal(mealKcal)} kcal`}
          hint={`目標 ${formatKcal(dog.targetKcal - Math.round((dog.targetKcal * dog.treatPct) / 100))}`}
        />
        <Stat
          label="おやつ"
          value={`${formatKcal(treatKcal)} kcal`}
          hint={
            treatShare > dog.treatPct + 0.4
              ? `目標 ${dog.treatPct}% を超過`
              : `上限 ${dog.treatPct}%`
          }
          warn={treatShare > dog.treatPct + 0.4}
        />
      </div>

      <div className="mt-5">
        <AddEntry
          dogId={dog.id}
          logDate={date}
          foods={foods}
          onAdded={refresh}
        />
      </div>

      <section className="mt-6">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-display text-base font-semibold">今日の記録</h2>
          <p className="text-xs text-muted tabular-nums">{entries.length}件</p>
        </div>
        {entries.length === 0 ? (
          <Card className="py-8 text-center">
            <p className="text-sm text-muted">まだ記録がありません</p>
            <p className="mt-1 text-xs text-subtle">上の欄でカロリーを足してください</p>
          </Card>
        ) : (
          <ul className="space-y-2">
            {entries.map((entry) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                onDelete={async () => {
                  await deleteEntry({ data: entry.id });
                  toast.success("削除しました");
                  await refresh();
                }}
              />
            ))}
          </ul>
        )}
      </section>

      <WeekBars date={date} target={dog.targetKcal} week={week} onSelect={setDate} />

      <p className="mt-6 text-center text-xs text-subtle">
        目標カロリーは
        <Link to="/plan" className="mx-1 font-medium text-primary underline-offset-2 hover:underline">
          プラン
        </Link>
        で計算しています
      </p>
    </AppShell>
  );
}

function Stat({
  label,
  value,
  hint,
  warn,
}: {
  label: string;
  value: string;
  hint: string;
  warn?: boolean;
}) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold tabular-nums">{value}</p>
      <p className={cn("mt-1 text-xs", warn ? "text-warn" : "text-subtle")}>{hint}</p>
    </Card>
  );
}

function EntryRow({
  entry,
  onDelete,
}: {
  entry: LogEntry;
  onDelete: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <li className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5">
      <Badge tone={entry.kind === "treat" ? "warn" : "ok"}>
        {entry.kind === "treat" ? "おやつ" : "ごはん"}
      </Badge>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{entry.name}</p>
        {entry.amount != null && entry.unit && (
          <p className="text-xs text-subtle tabular-nums">
            {entry.amount}
            {amountSuffix(entry.unit)}
          </p>
        )}
      </div>
      <p className="shrink-0 font-medium tabular-nums">
        {formatKcal(entry.kcal)}
        <span className="ml-0.5 text-xs font-normal text-muted">kcal</span>
      </p>
      <button
        type="button"
        disabled={busy}
        aria-label="削除"
        onClick={async () => {
          setBusy(true);
          try {
            await onDelete();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "削除できませんでした");
            setBusy(false);
          }
        }}
        className="grid size-10 shrink-0 place-items-center rounded-md text-subtle hover:bg-surface-2 hover:text-danger"
      >
        <Trash2 className="size-4" />
      </button>
    </li>
  );
}

function WeekBars({
  date,
  target,
  week,
  onSelect,
}: {
  date: string;
  target: number;
  week: DaySummary[];
  onSelect: (iso: string) => void;
}) {
  const days = useMemo(() => {
    const map = new Map(week.map((d) => [d.date, d]));
    return Array.from({ length: 7 }, (_, i) => {
      const iso = shiftDate(date, i - 6);
      return { iso, summary: map.get(iso) };
    });
  }, [date, week]);

  const max = Math.max(target, ...days.map((d) => d.summary?.totalKcal ?? 0), 1);

  return (
    <section className="mt-8">
      <h2 className="mb-3 font-display text-base font-semibold">直近7日</h2>
      <Card className="p-4">
        <div className="flex h-32 items-end gap-2">
          {days.map((day) => {
            const total = day.summary?.totalKcal ?? 0;
            const h = Math.max(4, (total / max) * 100);
            const active = day.iso === date;
            const over = target > 0 && total > target;
            const label = Number(day.iso.slice(8, 10));
            return (
              <button
                key={day.iso}
                type="button"
                onClick={() => onSelect(day.iso)}
                className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
              >
                <span
                  className={cn(
                    "w-full rounded-sm transition-[height,background-color] duration-300",
                    over ? "bg-danger/80" : "bg-primary/80",
                    active && "ring-2 ring-primary ring-offset-2 ring-offset-surface",
                  )}
                  style={{ height: `${h}%` }}
                />
                <span
                  className={cn(
                    "text-[11px] tabular-nums",
                    active ? "font-medium text-fg" : "text-subtle",
                  )}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-center text-xs text-subtle">
          棒をタップするとその日の記録を開けます
        </p>
      </Card>
    </section>
  );
}
