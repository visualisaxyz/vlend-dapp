"use client"

import { cn } from "@/lib/utils"

type AmountInputProps = {
  label: string
  sublabel?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  max?: string | number
  token?: string
  disabled?: boolean
}

export default function AmountInput({
  label,
  sublabel,
  value,
  onChange,
  placeholder = "0.00",
  max,
  token,
  disabled = false,
}: AmountInputProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide text-zinc-500">
          {label}
        </span>
        {sublabel && (
          <span className="font-mono text-[11px] text-zinc-500">
            {sublabel}
          </span>
        )}
      </div>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full rounded-[10px] border bg-white/[0.04] px-4 py-3 font-mono text-[15px] text-zinc-100 outline-none transition-colors placeholder:text-zinc-600",
            "border-white/[0.09] focus:border-green-500/40",
            token ? "pr-20" : "pr-4"
          )}
        />
        {token && (
          <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
            <div
              className="flex h-[18px] w-[18px] items-center justify-center rounded-full font-mono text-[9px] font-bold text-white"
              style={{
                background: "linear-gradient(135deg,#22c55e,#15803d)",
              }}
            >
              v
            </div>
            <span className="font-mono text-xs font-medium text-zinc-400">
              {token}
            </span>
          </div>
        )}
      </div>
      {max !== undefined && max !== "" && (
        <div className="mt-1.5 flex items-center justify-between">
          <span className="font-mono text-[11px] text-zinc-500">
            Available:{" "}
            <span className="text-zinc-400">
              {max} {token ?? ""}
            </span>
          </span>
          <button
            type="button"
            onClick={() => onChange(String(max))}
            className="rounded px-1.5 py-0.5 font-mono text-[10px] text-green-500 transition-colors hover:bg-green-500/10"
          >
            MAX
          </button>
        </div>
      )}
    </div>
  )
}
