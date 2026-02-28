"use client"

import type { LiveAuction } from "@/hooks/use-auctions-live"

type BidModalProps = {
  auction: LiveAuction
  onClose: () => void
  onConfirm: () => void
  walletVUSD: number
  isApproved?: boolean
  isLoading?: boolean
  isPending?: boolean
  error?: Error | null
}

export default function BidModal({
  auction,
  onClose,
  onConfirm,
  walletVUSD,
  isApproved = false,
  isLoading = false,
  isPending = false,
  error = null,
}: BidModalProps) {
  const currentPrice = Math.round(auction.currentPrice)
  const discount =
    auction.collateralUSD > 0
      ? ((auction.collateralUSD - currentPrice) / auction.collateralUSD) * 100
      : 0

  const canBid = walletVUSD >= currentPrice && !isPending && !isLoading
  const needsApproval = !isApproved && walletVUSD >= currentPrice

  return (
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-[200] flex items-center justify-center backdrop-blur-[14px]"
      style={{
        background: "rgba(0,0,0,0.85)",
        animation: "fIn 0.15s ease",
      }}
    >
      <div
        role="presentation"
        onClick={(e) => e.stopPropagation()}
        className="w-[460px] rounded-[22px] border border-white/[0.1] bg-[#111113] p-8 shadow-2xl"
        style={{ animation: "sUp 0.2s ease" }}
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="mb-0.5 text-lg font-semibold text-zinc-100">
              Confirm Bid
            </div>
            <div className="text-xs text-zinc-500">
              Auction #{auction.id} · Vault #{auction.vaultId}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.06] text-lg text-zinc-500 transition-colors hover:bg-white/[0.08]"
          >
            ×
          </button>
        </div>

        <div className="mb-5 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
          <div className="mb-5 flex items-center justify-between">
            <div className="text-center">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                You Pay
              </div>
              <div className="font-mono text-3xl font-semibold leading-none text-zinc-100">
                {currentPrice.toLocaleString()}
              </div>
              <div className="mt-1 text-xs text-zinc-500">vUSD</div>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center gap-1">
              <div className="h-px w-[70%] bg-gradient-to-r from-transparent via-green-500/40 to-transparent" />
              <span className="text-xl text-green-500">→</span>
              <div className="h-px w-[70%] bg-gradient-to-r from-transparent via-green-500/40 to-transparent" />
            </div>
            <div className="text-center">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                You Receive
              </div>
              <div className="font-mono text-3xl font-semibold leading-none text-green-500">
                {auction.collateral.toFixed(2)}
              </div>
              <div className="mt-1 text-xs text-zinc-500">WETH</div>
            </div>
          </div>
          <div className="mb-3.5 h-px bg-white/[0.06]" />
          {[
            ["Market value", `$${auction.collateralUSD.toLocaleString()}`],
            ["You pay", `$${currentPrice.toLocaleString()} vUSD`],
            ["Discount", `-${discount.toFixed(1)}%`],
          ].map(([l, v], i) => (
            <div
              key={l}
              className="mb-2 flex justify-between last:mb-0"
            >
              <span className="text-[13px] text-zinc-500">{l}</span>
              <span
                className={`font-mono text-[13px] ${i === 2 ? "font-semibold text-green-500" : "text-zinc-400"}`}
              >
                {v}
              </span>
            </div>
          ))}
          <div
            className="mt-1 flex justify-between rounded-lg border border-green-500/15 bg-green-500/10 px-3 py-2.5"
          >
            <span className="text-[13px] font-semibold text-green-500">
              You save
            </span>
            <span className="font-mono text-sm font-semibold text-green-500">
              ${Math.round(auction.collateralUSD - currentPrice).toLocaleString()}
            </span>
          </div>
        </div>

        <div
          className="mb-5 flex gap-2.5 rounded-[11px] border border-amber-500/20 bg-amber-500/5 px-4 py-3"
        >
          <span className="text-[15px] shrink-0">⚡</span>
          <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-600">
            First bidder wins all collateral. Price falls linearly — wait longer
            for a bigger discount, but risk losing to another bidder. Unclaimed
            collateral goes to the Last Resort module after 2 hours.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-500">
            {error.message}
          </div>
        )}

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-[11px] border border-white/[0.08] bg-white/[0.04] py-3 font-sans text-sm font-semibold text-zinc-400 transition-colors hover:bg-white/[0.06]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={walletVUSD < currentPrice || isPending}
            className="flex-[2] rounded-[11px] border-none py-3 font-sans text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg,#22c55e,#15803d)",
              boxShadow: "0 0 24px rgba(34,197,94,0.25)",
            }}
          >
            {isPending
              ? "Confirming..."
              : walletVUSD < currentPrice
                ? `Insufficient vUSD (need ${currentPrice.toLocaleString()})`
                : needsApproval
                  ? "Approve vUSD"
                  : `Confirm Bid — ${currentPrice.toLocaleString()} vUSD`}
          </button>
        </div>
      </div>
    </div>
  )
}
