"use client"

import { useEffect, useRef, useState } from "react"
import { useWeb3Modal } from "@web3modal/wagmi/react"
import { erc20Abi, formatUnits, parseUnits } from "viem"
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi"

import { MAX_ALLOWANCE, vlendAddresses } from "@/config/blockchain"
import useAbi from "@/hooks/use-abi"
import useAuctionHistory, {
  type AuctionHistoryItem,
} from "@/hooks/use-auction-history"
import useAuctionsLive, {
  type LiveAuction,
} from "@/hooks/use-auctions-live"
import useCollateralBalance from "@/hooks/use-collateral-balance"
import useCollaterals from "@/hooks/use-collaterals"
import useInternalChainId from "@/hooks/use-internal-chain-id"
import useTokenApproval from "@/hooks/use-token-approval"

import AuctionCard from "@/components/ui/auction-card"
import BidModal from "@/components/ui/bid-modal"
import ProgressBar from "@/components/ui/progress-bar"
import Tag from "@/components/ui/tag"

const PATH_COLOR: Record<string, string> = {
  auction: "#22c55e",
  stability: "#3b82f6",
  lastresort: "#71717a",
}
const PATH_LABEL: Record<string, string> = {
  auction: "Dutch Auction",
  stability: "Stability Pool",
  lastresort: "Last Resort",
}

export default function Auctions() {
  const { address } = useAccount()
  const { open: openWalletModal } = useWeb3Modal()
  const chainId = useInternalChainId()

  const { auctions, auctionDuration, isLoading } = useAuctionsLive()
  const { auctionHistory } = useAuctionHistory()
  const { collaterals } = useCollaterals()

  const [view, setView] = useState<"live" | "history">("live")
  const [bidTarget, setBidTarget] = useState<LiveAuction | null>(null)
  const [toast, setToast] = useState<{ msg: string; sub?: string } | null>(null)
  const [historyFilter, setHistoryFilter] = useState<
    "all" | "auction" | "stability" | "lastresort"
  >("all")

  const vusdAddress = vlendAddresses.mintableToken as `0x${string}`
  const auctionManagerAddress = vlendAddresses.auctionManager as `0x${string}`

  const { balance: vusdBalance, decimals: vusdDecimals } =
    useCollateralBalance(vusdAddress, address ?? "0x", false)
  const walletVUSD = vusdBalance
    ? parseFloat(formatUnits(vusdBalance, vusdDecimals ?? 18))
    : 0

  const bidAmount =
    bidTarget !== null ? parseUnits(Math.round(bidTarget.currentPrice).toString(), 18) : undefined

  const { isApproved } = useTokenApproval(
    vusdAddress,
    auctionManagerAddress,
    bidAmount
  )

  const auctionManagerAbi = useAbi("AuctionManager")
  const { writeContract, data: txHash, isPending, error, reset: resetWrite } =
    useWriteContract()
  const lastActionRef = useRef<"approve" | "bid" | null>(null)

  const { isSuccess: txSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
    chainId,
  })

  const filteredHistory = auctionHistory.filter(
    (h) => historyFilter === "all" || h.path === historyFilter
  )
  const myWins = auctionHistory.filter((h) => h.winner === "You")

  const avgDiscount =
    auctions.length > 0
      ? auctions.reduce((s, a) => {
          const p =
            a.collateralUSD > 0
              ? ((a.collateralUSD - a.currentPrice) / a.collateralUSD) * 100
              : 0
          return s + p
        }, 0) / auctions.length
      : 0

  function showToast(msg: string, sub?: string) {
    setToast({ msg, sub })
    setTimeout(() => setToast(null), 4500)
  }

  function handleBid(auction: LiveAuction) {
    if (!address) {
      openWalletModal()
      return
    }
    setBidTarget(auction)
    resetWrite()
  }

  function handleConfirmBid() {
    if (!bidTarget || !auctionManagerAbi?.abi) return

    if (!isApproved) {
      lastActionRef.current = "approve"
      writeContract({
        abi: erc20Abi,
        address: vusdAddress,
        chainId,
        functionName: "approve",
        args: [auctionManagerAddress, MAX_ALLOWANCE],
      })
      return
    }

    lastActionRef.current = "bid"
    writeContract({
      abi: auctionManagerAbi.abi,
      address: auctionManagerAddress,
      chainId,
      functionName: "bid",
      args: [BigInt(bidTarget.auctionId)],
    })
  }

  useEffect(() => {
    if (txSuccess && lastActionRef.current === "bid" && bidTarget) {
      showToast(
        `Bid confirmed on #${bidTarget.id}`,
        `${bidTarget.collateral.toFixed(2)} WETH received · tx submitted`
      )
      setBidTarget(null)
      lastActionRef.current = null
    }
  }, [txSuccess, bidTarget])

  function handleBidSuccess() {
    if (bidTarget) {
      showToast(
        `Bid confirmed on #${bidTarget.id}`,
        `${bidTarget.collateral.toFixed(2)} WETH received · tx submitted`
      )
    }
    setBidTarget(null)
  }

  if (isLoading) {
    return (
      <div className="container mt-20 flex items-center justify-center p-10 text-center text-sm">
        <ProgressBar />
      </div>
    )
  }

  return (
    <main className="mx-auto max-w-[1220px] px-7 py-10">
      {/* Page header */}
      <div className="mb-7 flex flex-col-reverse items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="mb-1 text-[22px] font-semibold tracking-tight">
            Liquidation Auctions
          </h1>
          <p className="text-[13px] text-zinc-500">
            Dutch auctions on seized vault collateral — price falls linearly
            until the first bidder wins
          </p>
        </div>
        <div className="flex gap-0.5 rounded-[10px] border border-white/[0.08] bg-white/[0.04] p-1">
          {[
            ["live", `Live (${auctions.length})`],
            ["history", "History"],
          ].map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v as "live" | "history")}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
                view === v ? "bg-white/[0.08] text-zinc-100" : "text-zinc-500"
              }`}
            >
              {v === "live" && "🔴 "}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Liquidation flow band */}
      <div className="mb-5 flex w-full items-center gap-2 rounded-[14px] border border-white/[0.06] bg-white/[0.015] px-6 py-4">
        {[
          {
            icon: "💀",
            label: "HF < 1.0",
            desc: "Vault liquidatable",
            color: "#ef4444",
          },
          null,
          {
            icon: "◎",
            label: "Stability Pool",
            desc: "Absorbs debt first",
            color: "#3b82f6",
          },
          null,
          {
            icon: "⟁",
            label: "Dutch Auction",
            desc: "You are here",
            color: "#22c55e",
            active: true,
          },
          null,
          {
            icon: "🛡",
            label: "Last Resort",
            desc: "If no bid in 2h",
            color: "#71717a",
          },
        ].map((item, i) =>
          item === null ? (
            <div key={i} className="shrink-0 text-sm text-zinc-500" aria-hidden>
              →
            </div>
          ) : (
            <div
              key={i}
              className="flex min-w-0 flex-1 items-center justify-center gap-2.5 rounded-[10px] px-3 py-1.5"
              style={{
                background: (item as { active?: boolean }).active
                  ? "rgba(34,197,94,0.07)"
                  : "transparent",
                border: (item as { active?: boolean }).active
                  ? "1px solid rgba(34,197,94,0.18)"
                  : "1px solid transparent",
              }}
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[15px]"
                style={{
                  background: `${item.color}12`,
                  border: `1px solid ${item.color}22`,
                }}
              >
                {item.icon}
              </div>
              <div className="min-w-0">
                <div
                  className={`text-xs font-semibold ${(item as { active?: boolean }).active ? "text-green-500" : "text-zinc-400"}`}
                >
                  {item.label}
                </div>
                <div className="text-[11px] text-zinc-500">{item.desc}</div>
              </div>
            </div>
          )
        )}
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          {
            label: "Live Auctions",
            value: auctions.length,
            color: "#ef4444",
            accent: true,
          },
          {
            label: "Total Collateral",
            value: `$${auctions.reduce((s, a) => s + a.collateralUSD, 0).toLocaleString()}`,
          },
          {
            label: "Total Debt",
            value: `${auctions.reduce((s, a) => s + a.debtVUSD, 0).toLocaleString()} vUSD`,
          },
          {
            label: "Avg. Discount",
            value: "18.4%",
            color: "#22c55e",
          },
          {
            label: "Liquidations (24h)",
            value: `${auctionHistory.length} events`,
          },
        ].map((c) => (
          <div
            key={c.label}
            className="relative overflow-hidden rounded-[14px] border border-white/[0.07] bg-white/[0.025] px-5 py-4"
            style={
              (c as { accent?: boolean }).accent
                ? { borderColor: "rgba(239,68,68,0.22)" }
                : undefined
            }
          >
            {(c as { accent?: boolean }).accent && (
              <div
                className="absolute left-0 right-0 top-0 h-0.5 rounded-t-[14px]"
                style={{
                  background: "linear-gradient(90deg,#ef4444,#b91c1c)",
                }}
              />
            )}
            <div className="mb-2 font-mono text-[10px] font-medium uppercase tracking-widest text-zinc-500">
              {c.label}
            </div>
            <div
              className="font-mono text-xl font-semibold tracking-tight"
              style={{
                color: (c as { color?: string }).color ?? "#f4f4f5",
              }}
            >
              {c.value}
            </div>
          </div>
        ))}
      </div>

      {view === "live" ? (
        <>
          {!address && (
            <div className="mb-5 flex items-center justify-between rounded-xl border border-green-500/12 bg-green-500/4 px-5 py-3">
              <div className="flex items-center gap-2.5">
                <span className="text-base">💡</span>
                <span className="text-[13px] text-zinc-500">
                  Connect your wallet to bid on live auctions and acquire
                  discounted WETH collateral
                </span>
              </div>
              <button
                type="button"
                onClick={() => openWalletModal()}
                className="shrink-0 rounded-lg border border-green-500/25 bg-green-500/10 px-4 py-2 text-xs font-semibold text-green-500 transition-colors hover:bg-green-500/20"
              >
                Connect Wallet
              </button>
            </div>
          )}

          {address && myWins.length > 0 && (
            <div className="mb-5 flex items-center justify-between rounded-xl border border-green-500/15 bg-green-500/4 px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">🏆</span>
                <div>
                  <div className="mb-0.5 text-[13px] font-semibold text-zinc-300">
                    You&apos;ve won {myWins.length} auction
                    {myWins.length > 1 ? "s" : ""} historically
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Total WETH acquired:{" "}
                    {myWins
                      .reduce((s, h) => s + h.collateral, 0)
                      .toFixed(2)}{" "}
                    WETH
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setView("history")}
                className="rounded-lg border border-green-500/20 bg-green-500/8 px-3.5 py-2 text-xs font-semibold text-green-500 transition-colors hover:bg-green-500/12"
              >
                View History →
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {auctions.map((a) => (
              <AuctionCard
                key={a.id}
                auction={a}
                auctionDuration={auctionDuration}
                onBid={handleBid}
                walletConnected={!!address}
              />
            ))}
          </div>

          {auctions.length === 0 && (
            <div className="py-20 text-center">
              <div className="mb-4 text-4xl">◎</div>
              <div className="mb-1.5 text-base text-zinc-500">
                No active auctions
              </div>
              <div className="text-[13px] text-zinc-600">
                All vaults are healthy. New auctions appear when a vault&apos;s
                HF drops below 1.0.
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-500">Filter:</span>
            {[
              ["all", "All"],
              ["auction", "Dutch Auction"],
              ["stability", "Stability Pool"],
              ["lastresort", "Last Resort"],
            ].map(([v, label]) => (
              <button
                key={v}
                type="button"
                onClick={() =>
                  setHistoryFilter(
                    v as "all" | "auction" | "stability" | "lastresort"
                  )
                }
                className={`rounded-lg border px-3 py-1.5 font-mono text-[11px] transition-colors ${
                  historyFilter === v
                    ? "border-white/[0.15] text-zinc-100"
                    : "border-white/[0.07] bg-white/[0.03] text-zinc-500 hover:border-white/[0.15] hover:text-zinc-300"
                }`}
                style={
                  historyFilter === v && v !== "all"
                    ? {
                        background: `${PATH_COLOR[v]}18`,
                        borderColor: `${PATH_COLOR[v]}40`,
                        color: PATH_COLOR[v],
                      }
                    : undefined
                }
              >
                {label}
              </button>
            ))}
            <span className="ml-auto font-mono text-[11px] text-zinc-500">
              {filteredHistory.length} events
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
            <div className="grid grid-cols-[90px_70px_1fr_1fr_1fr_1fr_90px] gap-3 px-6 py-3">
              {[
                "Auction",
                "Vault",
                "Collateral",
                "Debt",
                "Final Price",
                "Resolved By",
                "Time",
              ].map((h) => (
                <div
                  key={h}
                  className="font-mono text-[10px] uppercase tracking-widest text-zinc-600"
                >
                  {h}
                </div>
              ))}
            </div>
            {filteredHistory.length === 0 ? (
              <div className="border-t border-white/[0.04] px-6 py-12 text-center">
                <div className="mb-2 text-3xl">◎</div>
                <p className="text-sm text-zinc-500">
                  No auction history yet
                </p>
              </div>
            ) : (
            filteredHistory.map((h: AuctionHistoryItem) => (
              <div
                key={h.id}
                className="grid grid-cols-[90px_70px_1fr_1fr_1fr_1fr_90px] items-center gap-3 border-t border-white/[0.04] px-6 py-3.5 transition-colors hover:bg-white/[0.028]"
              >
                <div className="font-mono text-xs text-zinc-500">#{h.id}</div>
                <div className="font-mono text-xs text-zinc-500">
                  #{h.vaultId}
                </div>
                <div>
                  <div className="font-mono text-[13px] text-zinc-200">
                    {h.collateral} WETH
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] text-zinc-500">
                    ${h.collateralUSD.toLocaleString()}
                  </div>
                </div>
                <div className="font-mono text-[13px] text-zinc-200">
                  {h.debtVUSD.toLocaleString()} vUSD
                </div>
                <div>
                  {h.finalPriceVUSD ? (
                    <>
                      <div className="font-mono text-[13px] text-zinc-200">
                        {h.finalPriceVUSD.toLocaleString()} vUSD
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] text-green-500">
                        -{h.discountPct}%
                      </div>
                    </>
                  ) : (
                    <span className="font-mono text-xs text-zinc-600">—</span>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <Tag
                    color={
                      h.winner === "You" ? "#22c55e" : PATH_COLOR[h.path] ?? "#71717a"
                    }
                    small
                  >
                    {h.winner === "You" ? "You won" : PATH_LABEL[h.path]}
                  </Tag>
                  <span className="font-mono text-[10px] text-zinc-500">
                    {h.winner}
                  </span>
                </div>
                <div className="font-mono text-[11px] text-zinc-500">
                  {h.resolvedAt}
                </div>
              </div>
            )))}
          </div>
        </>
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed right-6 top-[76px] z-[300] flex min-w-[290px] items-center gap-2.5 rounded-xl border border-green-500/32 bg-[#111113] p-3.5 shadow-2xl"
          style={{ animation: "slideIn 0.3s ease" }}
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-[13px] text-green-500">
            ✓
          </div>
          <div>
            <div className="text-[13px] font-semibold text-zinc-100">
              {toast.msg}
            </div>
            {toast.sub && (
              <div className="mt-0.5 text-[11px] text-zinc-500">
                {toast.sub}
              </div>
            )}
          </div>
        </div>
      )}

      {/* BidModal */}
      {bidTarget && (
        <BidModal
          auction={bidTarget}
          onClose={() => setBidTarget(null)}
          onConfirm={handleConfirmBid}
          walletVUSD={walletVUSD}
          isApproved={isApproved}
          isLoading={!auctionManagerAbi?.abi}
          isPending={isPending}
          error={error}
        />
      )}
    </main>
  )
}
