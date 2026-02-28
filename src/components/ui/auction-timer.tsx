"use client"

type AuctionTimerProps = {
  seconds: number
}

export default function AuctionTimer({ seconds }: AuctionTimerProps) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  const urgent = seconds < 1800

  return (
    <span
      className={`font-mono text-xs tracking-wider ${
        urgent ? "text-red-500" : "text-zinc-500"
      }`}
    >
      {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  )
}
