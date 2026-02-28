"use client"

import { cn } from "@/lib/utils"

type TokenInputProps = {
  label: string
  token: string
  tokenColor?: string
  value: string
  onChange?: (value: string) => void
  max?: number
  note?: string
  readonly?: boolean
}

export default function TokenInput({
  label,
  token,
  tokenColor = "#22c55e",
  value,
  onChange,
  max,
  note,
  readonly = false,
}: TokenInputProps) {
  const isGreen = tokenColor === "#22c55e"
  const badgeGradient = isGreen
    ? "linear-gradient(135deg,#22c55e,#15803d)"
    : "linear-gradient(135deg,#3b82f6,#1d4ed8)"
  const badgeChar = token === "vUSD" ? "v" : "$"

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide text-zinc-500">
          {label}
        </span>
        {max !== undefined && (
          <span className="font-mono text-[11px] text-zinc-500">
            Balance:{" "}
            <span className="text-zinc-400">
              {max.toLocaleString()} {token}
            </span>
          </span>
        )}
      </div>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          readOnly={readonly}
          placeholder="0.00"
          className={cn(
            "w-full rounded-xl border px-4 py-3.5 pr-[110px] font-mono text-lg outline-none transition-colors placeholder:text-zinc-600",
            readonly
              ? "border-white/[0.05] bg-white/[0.02] text-zinc-500"
              : "border-white/[0.09] bg-white/[0.04] text-zinc-100 focus:border-green-500/40 caret-green-500"
          )}
        />
        <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.06] px-2.5 py-1.5">
          <div
            className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white"
            style={{ background: badgeGradient }}
          >
            {badgeChar}
          </div>
          <span className="font-mono text-xs font-medium text-zinc-400">
            {token}
          </span>
        </div>
      </div>
      {max !== undefined && !readonly && (
        <div className="mt-1.5 flex justify-end gap-1.5">
          {[25, 50, 75, 100].map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() =>
                onChange?.(String(((max * pct) / 100).toFixed(2)))
              }
              className="rounded-md border border-white/[0.07] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 transition-colors hover:border-green-500/30 hover:text-green-500"
            >
              {pct === 100 ? "MAX" : `${pct}%`}
            </button>
          ))}
        </div>
      )}
      {note && (
        <p className="mt-1.5 text-[11px] text-zinc-500">{note}</p>
      )}
    </div>
  )
}
