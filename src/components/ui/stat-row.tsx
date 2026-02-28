"use client"

import { cn } from "@/lib/utils"

type StatRowProps = {
  label: string
  value: string | React.ReactNode
  highlight?: string
  border?: boolean
}

export default function StatRow({
  label,
  value,
  highlight,
  border = true,
}: StatRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-3",
        border && "border-b border-white/[0.05]"
      )}
    >
      <span className="text-[13px] text-zinc-500">{label}</span>
      <span
        className={cn(
          "font-mono text-sm font-medium",
          highlight ? "" : "text-zinc-200"
        )}
        style={highlight ? { color: highlight } : undefined}
      >
        {value}
      </span>
    </div>
  )
}
