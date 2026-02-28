"use client"

type HealthBarProps = {
  value: number
  /** Redemption zone variant: Critical / High Risk / At Risk for HF < 1.15 / < 1.3 / else */
  variant?: "default" | "redemption"
  /** Stack value and label vertically to prevent overlap in tight table layouts */
  compact?: boolean
}

export default function HealthBar({
  value,
  variant = "default",
  compact = false,
}: HealthBarProps) {
  const pct =
    variant === "redemption"
      ? Math.min(((value - 1.0) / 0.5) * 100, 100)
      : Math.min(Math.max(((value - 1) / 1.5) * 100, 0), 100)

  const color =
    variant === "redemption"
      ? value < 1.15
        ? "#ef4444"
        : value < 1.3
          ? "#f97316"
          : "#eab308"
      : value >= 1.7
        ? "#22c55e"
        : value >= 1.3
          ? "#eab308"
          : "#ef4444"

  const label =
    variant === "redemption"
      ? value < 1.15
        ? "Critical"
        : value < 1.3
          ? "High Risk"
          : "At Risk"
      : value >= 1.7
        ? "Safe"
        : value >= 1.3
          ? "At Risk"
          : "Danger"

  return (
    <div className="flex min-w-[120px] flex-col gap-1">
      <div
        className={
          compact
            ? "flex flex-col gap-0.5"
            : "flex justify-between"
        }
      >
        <span
          className="font-mono text-[13px] font-medium tracking-wide"
          style={{ color }}
        >
          {value.toFixed(2)}
        </span>
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
          {label}
        </span>
      </div>
      <div className="h-[3px] rounded-sm bg-white/[0.06]">
        <div
          className="h-full rounded-sm transition-[width] duration-500 ease-out"
          style={{
            width: `${pct}%`,
            background: color,
            boxShadow: `0 0 6px ${color}50`,
          }}
        />
      </div>
    </div>
  )
}
