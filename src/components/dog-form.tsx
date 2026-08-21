import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ACTIVITIES, GOALS, LIFE_STAGES, type Dog, type DogInput } from "@/lib/types";
import { cn } from "@/lib/utils";

const empty: DogInput = {
  name: "",
  currentWeightKg: 8,
  idealWeightKg: 7,
  lifeStage: "adult",
  activity: "moderate",
  neutered: true,
  goal: "lose",
  mealsPerDay: 2,
  treatPct: 10,
};

export function DogForm({
  dog,
  submitLabel,
  onSave,
}: {
  dog?: Dog | null;
  submitLabel: string;
  onSave: (input: DogInput) => Promise<void>;
}) {
  const [form, setForm] = useState<DogInput>(() =>
    dog
      ? {
          name: dog.name,
          currentWeightKg: dog.currentWeightKg,
          idealWeightKg: dog.idealWeightKg,
          lifeStage: dog.lifeStage,
          activity: dog.activity,
          neutered: dog.neutered,
          goal: dog.goal,
          mealsPerDay: dog.mealsPerDay,
          treatPct: dog.treatPct,
        }
      : empty,
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSave(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="名前" htmlFor="dog-name">
        <Input
          id="dog-name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="ポチ"
          required
          autoComplete="off"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="現在の体重 (kg)" htmlFor="current-kg">
          <Input
            id="current-kg"
            type="number"
            inputMode="decimal"
            min={0.5}
            max={120}
            step={0.1}
            value={form.currentWeightKg}
            onChange={(e) =>
              setForm((f) => ({ ...f, currentWeightKg: Number(e.target.value) }))
            }
            required
          />
        </Field>
        <Field label="理想体重 (kg)" htmlFor="ideal-kg">
          <Input
            id="ideal-kg"
            type="number"
            inputMode="decimal"
            min={0.5}
            max={120}
            step={0.1}
            value={form.idealWeightKg}
            onChange={(e) =>
              setForm((f) => ({ ...f, idealWeightKg: Number(e.target.value) }))
            }
            required
          />
        </Field>
      </div>

      <Field label="ライフステージ" htmlFor="life-stage">
        <NativeSelect
          id="life-stage"
          value={form.lifeStage}
          onChange={(v) =>
            setForm((f) => ({ ...f, lifeStage: v as DogInput["lifeStage"] }))
          }
          options={LIFE_STAGES.map((s) => ({ value: s.value, label: s.label }))}
        />
      </Field>

      <Field label="活動量" htmlFor="activity">
        <NativeSelect
          id="activity"
          value={form.activity}
          onChange={(v) =>
            setForm((f) => ({ ...f, activity: v as DogInput["activity"] }))
          }
          options={ACTIVITIES.map((s) => ({ value: s.value, label: s.label }))}
        />
      </Field>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-muted">避妊・去勢</legend>
        <Segmented
          value={form.neutered ? "yes" : "no"}
          onChange={(v) => setForm((f) => ({ ...f, neutered: v === "yes" }))}
          options={[
            { value: "yes", label: "済み" },
            { value: "no", label: "していない" },
          ]}
        />
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-muted">目標</legend>
        <Segmented
          value={form.goal}
          onChange={(v) => setForm((f) => ({ ...f, goal: v as DogInput["goal"] }))}
          options={GOALS.map((g) => ({ value: g.value, label: g.label }))}
        />
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <Field label="1日の食事回数" htmlFor="meals">
          <NativeSelect
            id="meals"
            value={String(form.mealsPerDay)}
            onChange={(v) => setForm((f) => ({ ...f, mealsPerDay: Number(v) }))}
            options={[
              { value: "1", label: "1回" },
              { value: "2", label: "2回" },
              { value: "3", label: "3回" },
              { value: "4", label: "4回" },
            ]}
          />
        </Field>
        <Field label="おやつの割合 (%)" htmlFor="treat-pct">
          <Input
            id="treat-pct"
            type="number"
            inputMode="decimal"
            min={0}
            max={20}
            step={0.5}
            value={form.treatPct}
            onChange={(e) =>
              setForm((f) => ({ ...f, treatPct: Number(e.target.value) }))
            }
          />
        </Field>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" className="w-full" size="lg" disabled={busy}>
        {busy ? "保存中…" : submitLabel}
      </Button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function NativeSelect({
  id,
  value,
  onChange,
  options,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 w-full appearance-none overflow-hidden rounded-md border border-border bg-surface bg-[length:12px] bg-[right_12px_center] bg-no-repeat px-3 pr-9 text-base text-fg outline-none transition-[border-color,box-shadow] duration-150 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path fill='%236f675c' d='M1 1l5 5 5-5'/></svg>\")",
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-md bg-surface-2 p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "h-10 rounded-sm px-2 text-sm font-medium transition-colors duration-150",
              active
                ? "bg-surface text-fg shadow-card"
                : "text-muted hover:text-fg",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
