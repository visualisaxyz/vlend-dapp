"use client"

type PriceChartProps = {
  auction: {
    startPrice: number
    floorPrice: number
    timeLeft: number
  }
  auctionDuration: number
}

export default function PriceChart({ auction, auctionDuration }: PriceChartProps) {
  const progress = 1 - auction.timeLeft / auctionDuration
  const priceAt = (t: number) =>
    auction.startPrice + (auction.floorPrice - auction.startPrice) * t

  const W = 300
  const H = 80

  const pts = Array.from({ length: 61 }, (_, i) => i / 60)
  const minP = Math.min(auction.startPrice, auction.floorPrice) * 0.97
  const maxP = Math.max(auction.startPrice, auction.floorPrice) * 1.02
  const toX = (t: number) => t * W
  const toY = (p: number) =>
    H - ((p - minP) / (maxP - minP)) * H

  const pathD = pts
    .map((t, i) =>
      `${i === 0 ? "M" : "L"} ${toX(t).toFixed(1)} ${toY(priceAt(t)).toFixed(1)}`
    )
    .join(" ")

  const nowX = toX(progress)
  const nowY = toY(priceAt(progress))
  const id = auction.startPrice.toString().replace(/\W/g, "") + auction.floorPrice

  return (
    <svg
      width={W}
      height={H}
      className="block overflow-visible"
    >
      <defs>
        <linearGradient
          id={`a-${id}`}
          x1="0"
          y1="0"
          x2="1"
          y2="0"
        >
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient
          id={`l-${id}`}
          x1="0"
          y1="0"
          x2="1"
          y2="0"
        >
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      </defs>
      <path
        d={`${pathD} L ${W} ${H} L 0 ${H} Z`}
        fill={`url(#a-${id})`}
      />
      <path
        d={pathD}
        stroke={`url(#l-${id})`}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <line
        x1={nowX}
        y1={0}
        x2={nowX}
        y2={H}
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      <circle
        cx={nowX}
        cy={nowY}
        r={4}
        fill="#f4f4f5"
        stroke="#0c0c0e"
        strokeWidth={2}
      />
    </svg>
  )
}
