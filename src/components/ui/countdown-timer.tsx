"use client"

type CountdownTimerProps = {
  seconds: number
}

export default function CountdownTimer({ seconds }: CountdownTimerProps) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60

  const urgent = seconds < 900
  const warning = seconds < 2700
  const color = urgent ? "#ef4444" : warning ? "#eab308" : "#a1a1aa"

  const blocks: [number, string][] = [
    [h, "h"],
    [m, "m"],
    [s, "s"],
  ]

  return (
    <div className="flex items-center gap-1.5">
      {blocks.map(([val, unit]) => (
        <div
          key={unit}
          className="flex flex-col items-center"
        >
          <div
            className="min-w-[30px] text-center font-mono text-xl font-semibold leading-none"
            style={{ color }}
          >
            {String(val).padStart(2, "0")}
          </div>
          <div className="mt-0.5 font-mono text-[9px] tracking-widest text-zinc-600">
            {unit}
          </div>
        </div>
      ))}
    </div>
  )
}
