"use client"

import type { LiveAuction } from "@/hooks/use-auctions-live"

import CountdownTimer from "./countdown-timer"
import PriceChart from "./price-chart"
import Tag from "./tag"

type AuctionCardProps = {
  auction: LiveAuction
  auctionDuration: number
  onBid: (auction: LiveAuction) => void
  walletConnected: boolean
}

export default function AuctionCard({
  auction,
  auctionDuration,
  onBid,
  walletConnected,
}: AuctionCardProps) {
  const progress = 1 - auction.timeLeft / auctionDuration
  const currentPrice = Math.round(auction.currentPrice)
  const discount =
    auction.collateralUSD > 0
      ? ((auction.collateralUSD - currentPrice) / auction.collateralUSD) * 100
      : 0

  const urgency =
    auction.timeLeft < 900 ? "urgent" : auction.timeLeft < 2700 ? "warning" : "normal"
  const urgencyColor =
    urgency === "urgent" ? "#ef4444" : urgency === "warning" ? "#eab308" : "#22c55e"

  return (
    <div
      className="flex flex-col overflow-hidden rounded-[18px]"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: `1px solid ${
          urgency === "urgent"
            ? "rgba(239,68,68,0.3)"
            : urgency === "warning"
              ? "rgba(234,179,8,0.22)"
              : "rgba(255,255,255,0.08)"
        }`,
      }}
    >
      {urgency !== "normal" && (
        <div
          className="h-0.5"
          style={{
            background: `linear-gradient(90deg, ${urgencyColor}, transparent)`,
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between border-b border-white/[0.05] px-5 py-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-zinc-200">
              #{auction.id}
            </span>
            <Tag color={urgencyColor} small>
              {urgency === "urgent" ? "Ending Soon" : "Live"}
            </Tag>
          </div>
          <div className="font-mono text-[10px] text-zinc-500">
            Vault #{auction.vaultId} collateral
          </div>
        </div>
        <CountdownTimer seconds={auction.timeLeft} />
      </div>

      <div className="flex flex-1 flex-col gap-4 px-5 py-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            {
              label: "You Receive",
              val: `${auction.collateral.toFixed(2)} WETH`,
              sub: `$${auction.collateralUSD.toLocaleString()} market`,
              g: false,
            },
            {
              label: "You Pay Now",
              val: `${currentPrice.toLocaleString()} vUSD`,
              sub: "decreasing over time",
              g: false,
            },
            {
              label: "Discount",
              val: `-${discount.toFixed(1)}%`,
              sub: `$${Math.round(auction.collateralUSD - currentPrice).toLocaleString()} saved`,
              g: true,
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-[10px] px-3 py-2.5"
              style={{
                background: s.g ? "rgba(34,197,94,0.07)" : "rgba(255,255,255,0.03)",
                border: s.g ? "1px solid rgba(34,197,94,0.15)" : "none",
              }}
            >
              <div className="mb-1 font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                {s.label}
              </div>
              <div
                className={`font-mono text-[15px] font-semibold ${s.g ? "text-green-500" : "text-zinc-200"}`}
              >
                {s.val}
              </div>
              <div className="mt-0.5 font-mono text-[9px] text-zinc-500">
                {s.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div>
          <div className="mb-2 font-mono text-[9px] uppercase tracking-widest text-zinc-600">
            Price Decay Curve
          </div>
          <PriceChart
            auction={{
              startPrice: auction.startPrice,
              floorPrice: auction.floorPrice,
              timeLeft: auction.timeLeft,
            }}
            auctionDuration={auctionDuration}
          />
          <div className="mt-1 flex justify-between">
            <span className="font-mono text-[9px] text-zinc-600">
              ${auction.startPrice.toLocaleString()} start
            </span>
            <span className="font-mono text-[10px] font-medium text-zinc-100">
              ${currentPrice.toLocaleString()} now
            </span>
            <span className="font-mono text-[9px] text-zinc-600">
              ${auction.floorPrice.toLocaleString()} floor
            </span>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="h-1 overflow-hidden rounded-sm bg-white/[0.05]">
            <div
              className="h-full rounded-sm transition-[width] duration-1000 ease-linear"
              style={{
                width: `${progress * 100}%`,
                background: `linear-gradient(90deg,#22c55e,${urgencyColor})`,
              }}
            />
          </div>
          <div className="mt-1 flex justify-between">
            <span className="font-mono text-[9px] text-zinc-600">
              Auction start
            </span>
            <span className="font-mono text-[9px] text-zinc-600">
              2h window
            </span>
          </div>
        </div>

        {/* Bid button */}
        <button
          type="button"
          onClick={() => onBid(auction)}
          className="w-full rounded-[11px] py-3 font-sans text-[13px] font-semibold text-white transition-all hover:opacity-90 hover:-translate-y-px"
          style={{
            background: "linear-gradient(135deg,#22c55e,#15803d)",
            boxShadow: "0 0 22px rgba(34,197,94,0.2)",
          }}
        >
          {walletConnected
            ? `Bid ${currentPrice.toLocaleString()} vUSD → Get ${auction.collateral.toFixed(2)} WETH`
            : "Connect Wallet to Bid"}
        </button>
      </div>
    </div>
  )
}
