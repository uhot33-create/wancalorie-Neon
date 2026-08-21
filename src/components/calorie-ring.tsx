import { formatKcal } from "@/lib/utils";

export function CalorieRing({
  current,
  target,
}: {
  current: number;
  target: number;
}) {
  const ratio = target > 0 ? current / target : 0;
  const over = ratio > 1.005;
  const r = 86;
  const c = 2 * Math.PI * r;
  const filled = c * Math.min(ratio, 1);
  const remain = Math.round(target - current);

  return (
    <div className="relative mx-auto grid size-56 place-items-center">
      <svg viewBox="0 0 200 200" className="size-full -rotate-90" aria-hidden="true">
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke="var(--color-ring-track)"
          strokeWidth="12"
        />
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke={over ? "var(--color-over)" : "var(--color-primary)"}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${c - filled}`}
          className="transition-[stroke-dasharray] duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="font-display text-5xl font-semibold tabular-nums tracking-tight">
          {formatKcal(current)}
        </p>
        <p className="mt-1 text-sm text-muted tabular-nums">
          / {formatKcal(target)} kcal
        </p>
        <p
          className={
            over
              ? "mt-2 text-xs font-medium text-danger"
              : "mt-2 text-xs font-medium text-primary"
          }
        >
          {target <= 0
            ? "目標を設定してください"
            : over
              ? `${formatKcal(Math.abs(remain))} kcal オーバー`
              : remain === 0
                ? "ちょうど目標です"
                : `あと ${formatKcal(remain)} kcal`}
        </p>
      </div>
    </div>
  );
}
