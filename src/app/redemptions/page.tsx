"use client"

import { Fragment, useEffect, useState } from "react"
import Link from "next/link"
import { useWeb3Modal } from "@web3modal/wagmi/react"
import { formatUnits } from "viem"
import { useAccount } from "wagmi"

import { vlendAddresses } from "@/config/blockchain"
import useCollateralBalance from "@/hooks/use-collateral-balance"
import useCollaterals from "@/hooks/use-collaterals"
import useRedemptionHistory from "@/hooks/use-redemption-history"
import useRedeemableVaultsMerged, {
  type RedeemableVaultMerged,
} from "@/hooks/use-redeemable-vaults-merged"

import HealthBar from "@/components/ui/health-bar"
import ProgressBar from "@/components/ui/progress-bar"
import RedeemModal from "@/components/ui/redeem-modal"
import Tag from "@/components/ui/tag"

export default function Redemptions() {
  const { address } = useAccount()
  const { open: openWalletModal } = useWeb3Modal()
  const { redeemableVaults, isLoading } = useRedeemableVaultsMerged()
  const { redemptionHistory } = useRedemptionHistory()
  const { collaterals } = useCollaterals()

  const [view, setView] = useState<"live" | "history">("live")
  const [sortBy, setSortBy] = useState<"hf" | "collateral" | "debt">("hf")
  const [filterOwn, setFilterOwn] = useState(false)
  const [redeemTarget, setRedeemTarget] = useState<RedeemableVaultMerged | null>(
    null
  )
  const [toast, setToast] = useState<{ msg: string; sub?: string } | null>(null)

  const vusdAddress = vlendAddresses.mintableToken as `0x${string}`
  const { balance: vusdBalance, decimals: vusdDecimals } =
    useCollateralBalance(vusdAddress, address ?? "0x", false)
  const walletVUSD = vusdBalance
    ? parseFloat(formatUnits(vusdBalance, vusdDecimals ?? 18))
    : 0

  const wethCollateral = collaterals?.find(
    (c) =>
      c.tokenName?.toUpperCase() === "WETH" ||
      c.address?.toLowerCase() ===
        "0x4200000000000000000000000000000000000006"
  )
  const wethPrice = parseFloat(wethCollateral?.price ?? "3100")

  const ownAtRisk = redeemableVaults.filter((v) => v.isOwn)
  const sorted = [...redeemableVaults]
    .filter((v) => !filterOwn || v.isOwn)
    .sort((a, b) =>
      sortBy === "hf"
        ? a.healthFactor - b.healthFactor
        : sortBy === "collateral"
          ? b.collateralUSD - a.collateralUSD
          : b.debtVUSD - a.debtVUSD
    )

  function showToast(msg: string, sub?: string) {
    setToast({ msg, sub })
    setTimeout(() => setToast(null), 4000)
  }

  if (isLoading) {
    return (
      <div className="container mt-20 flex items-center justify-center p-10 text-center text-sm">
        <ProgressBar />
      </div>
    )
  }

  return (
    <main className="mx-auto max-w-[1180px] px-7 py-10">
      {/* Page header */}
      <div className="mb-7 flex flex-col-reverse items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="mb-1 text-[22px] font-semibold tracking-tight">
            Redemptions
          </h1>
          <p className="text-[13px] text-zinc-500">
            Burn vUSD against at-risk vaults (HF 1.0–1.5) to redeem collateral
            at minimum collateral ratio
          </p>
        </div>
        <div className="flex items-center gap-0.5 rounded-[10px] border border-white/[0.08] bg-white/[0.04] p-1">
          {[
            ["live", "Live Vaults"],
            ["history", "History"],
          ].map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v as "live" | "history")}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
                view === v
                  ? "bg-white/[0.08] text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* How it works band */}
      <div className="mb-5 flex w-full items-center gap-2 rounded-[14px] border border-white/[0.06] bg-white/[0.015] px-6 py-4">
        {[
          {
            icon: "⚠",
            label: "HF drops below 1.5",
            desc: "Vault enters redemption zone",
            color: "#eab308",
          },
          null,
          {
            icon: "🔥",
            label: "Anyone burns vUSD",
            desc: "Or vault owner repays",
            color: "#eab308",
          },
          null,
          {
            icon: "💎",
            label: "Receive WETH at MCR",
            desc: "1:1 dollar value redeemed",
            color: "#22c55e",
          },
          null,
          {
            icon: "📈",
            label: "Vault HF improves",
            desc: "Or vault is fully closed",
            color: "#3b82f6",
          },
        ].map((item, i) =>
          item === null ? (
            <div
              key={i}
              className="shrink-0 text-sm text-zinc-500"
              aria-hidden
            >
              →
            </div>
          ) : (
            <div
              key={i}
              className="flex min-w-0 flex-1 items-center justify-center gap-2"
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm"
                style={{
                  background: `${item.color}12`,
                  border: `1px solid ${item.color}22`,
                }}
              >
                {item.icon}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-zinc-300">
                  {item.label}
                </div>
                <div className="text-[11px] text-zinc-500">{item.desc}</div>
              </div>
            </div>
          )
        )}
      </div>

      {/* Stat cards */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Redeemable Vaults",
            value: redeemableVaults.length,
            color: "#eab308",
            accent: true,
          },
          {
            label: "Total Redeemable Collateral",
            value: `$${redeemableVaults
              .reduce((s, v) => s + v.collateralUSD, 0)
              .toLocaleString()}`,
          },
          {
            label: "Your Vaults at Risk",
            value: address ? ownAtRisk.length : "—",
            color: ownAtRisk.length > 0 ? "#ef4444" : "#22c55e",
          },
          {
            label: "Redemptions (24h)",
            value: `${redemptionHistory.length} events`,
          },
        ].map((c) => (
          <div
            key={c.label}
            className="relative overflow-hidden rounded-[14px] border border-white/[0.07] bg-white/[0.025] px-5 py-4"
            style={
              c.accent
                ? { borderColor: "rgba(234,179,8,0.22)" }
                : undefined
            }
          >
            {c.accent && (
              <div
                className="absolute left-0 right-0 top-0 h-0.5 rounded-t-[14px]"
                style={{
                  background: "linear-gradient(90deg,#eab308,#a16207)",
                }}
              />
            )}
            <div className="mb-2 font-mono text-[11px] font-medium uppercase tracking-widest text-zinc-500">
              {c.label}
            </div>
            <div
              className="font-mono text-[22px] font-medium tracking-tight"
              style={{ color: (c as { color?: string }).color ?? "#f4f4f5" }}
            >
              {c.value}
            </div>
          </div>
        ))}
      </div>

      {/* Own vault warning */}
      {address && ownAtRisk.length > 0 && (
        <div className="mb-5 flex flex-col gap-4 rounded-[14px] border border-red-500/22 bg-red-500/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-red-500/10 text-lg">
              ⚠️
            </div>
            <div>
              <div className="mb-0.5 text-[13px] font-semibold text-red-300">
                {ownAtRisk.length === 1
                  ? "You have 1 vault"
                  : `You have ${ownAtRisk.length} vaults`}{" "}
                at risk of redemption
              </div>
              <div className="text-xs text-zinc-500">
                Vaults with HF below 1.5 can be redeemed against by anyone. Add
                collateral or repay debt to protect your position.
              </div>
            </div>
          </div>
          <Link
            href="/vaults"
            className="shrink-0 rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-500 transition-colors hover:bg-red-500/20"
          >
            Manage My Vaults →
          </Link>
        </div>
      )}

      {view === "live" ? (
        <>
          {/* Toolbar */}
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Sort by:</span>
              {[
                ["hf", "Health Factor"],
                ["collateral", "Collateral"],
                ["debt", "Debt"],
              ].map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setSortBy(v as "hf" | "collateral" | "debt")}
                  className={`rounded-lg border px-3 py-1 font-mono text-[11px] transition-colors ${
                    sortBy === v
                      ? "border-white/[0.15] bg-white/[0.08] text-zinc-100"
                      : "border-white/[0.07] bg-white/[0.03] text-zinc-500 hover:border-white/[0.14] hover:text-zinc-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {address && (
              <label className="flex cursor-pointer items-center gap-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={filterOwn}
                  onClick={() => setFilterOwn((f) => !f)}
                  className={`relative h-[18px] w-8 rounded-full transition-colors ${
                    filterOwn ? "bg-green-500" : "bg-white/10"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white shadow transition-all duration-200 ${
                      filterOwn ? "left-4" : "left-0.5"
                    }`}
                  />
                </button>
                <span className="text-xs text-zinc-500">My vaults only</span>
              </label>
            )}
          </div>

          {/* Connect wallet CTA */}
          {!address && (
            <div className="mb-4 flex items-center justify-between rounded-xl border border-amber-500/14 bg-amber-500/5 px-5 py-3">
              <span className="text-[13px] text-zinc-500">
                Connect your wallet to redeem against at-risk vaults
              </span>
              <button
                type="button"
                onClick={() => openWalletModal()}
                className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-500 transition-colors hover:bg-amber-500/20"
              >
                Connect Wallet
              </button>
            </div>
          )}

          {/* Vault table - single grid so header and data columns align */}
          <div className="w-full overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
            {sorted.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mb-3 text-3xl">◎</div>
                <div className="text-sm text-zinc-500">
                  No vaults match this filter
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-4">
                  <Link
                    href="/vaults"
                    className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold transition-colors hover:bg-white/10"
                  >
                    Explore Vaults
                  </Link>
                  <Link
                    href="/statistics"
                    className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold transition-colors hover:bg-white/10"
                  >
                    Go to Statistics
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid w-full grid-cols-[1fr_1fr_1.2fr_1fr_1fr_1.4fr_auto] gap-x-3 gap-y-0 sm:gap-x-4">
                {/* Header row - same grid as data rows for perfect alignment */}
                {[
                  "Vault",
                  "Owner",
                  "Collateral",
                  "Debt (vUSD)",
                  "Col. Ratio",
                  "Health Factor",
                  "",
                ].map((h) => (
                  <div
                    key={h}
                    className="min-w-0 border-b border-white/[0.04] px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-zinc-600 sm:px-6"
                  >
                    {h}
                  </div>
                ))}
                {/* Data rows - each row's cells are 7 consecutive grid items */}
                {sorted.map((v) => {
                  const urgencyColor =
                    v.healthFactor < 1.15
                      ? "#ef4444"
                      : v.healthFactor < 1.3
                        ? "#f97316"
                        : "#eab308"
                  return (
                    <Fragment key={v.address}>
                      <div
                        key={`${v.address}-1`}
                        className="flex min-w-0 flex-col gap-1 border-b border-white/[0.04] px-4 py-4 transition-colors hover:bg-white/[0.032] sm:px-6"
                      >
                        <span className="font-mono text-xs text-zinc-500">
                          #{v.id}
                        </span>
                        {v.isOwn && (
                          <Tag color="#22c55e" small>
                            Yours
                          </Tag>
                        )}
                      </div>
                      <div
                        key={`${v.address}-2`}
                        className={`min-w-0 border-b border-white/[0.04] px-4 py-4 font-mono text-xs transition-colors hover:bg-white/[0.032] sm:px-6 ${
                          v.isOwn ? "text-green-500" : "text-zinc-500"
                        }`}
                      >
                        {v.isOwn ? "You" : v.owner}
                      </div>
                      <div
                        key={`${v.address}-3`}
                        className="min-w-0 border-b border-white/[0.04] px-4 py-4 transition-colors hover:bg-white/[0.032] sm:px-6"
                      >
                        <div className="font-mono text-[13px] text-zinc-200">
                          {v.collateral.toFixed(2)} {v.collateralTokenSymbol}
                        </div>
                        <div className="mt-0.5 font-mono text-[10px] text-zinc-500">
                          ${v.collateralUSD.toLocaleString()}
                        </div>
                      </div>
                      <div
                        key={`${v.address}-4`}
                        className="min-w-0 border-b border-white/[0.04] px-4 py-4 font-mono text-[13px] text-zinc-200 transition-colors hover:bg-white/[0.032] sm:px-6"
                      >
                        {v.debtVUSD.toLocaleString()}
                      </div>
                      <div
                        key={`${v.address}-5`}
                        className="min-w-0 border-b border-white/[0.04] px-4 py-4 transition-colors hover:bg-white/[0.032] sm:px-6"
                      >
                        <div
                          className="font-mono text-[13px] font-medium"
                          style={{ color: urgencyColor }}
                        >
                          {v.collateralRatio.toFixed(1)}%
                        </div>
                        <div className="mt-0.5 font-mono text-[10px] text-zinc-600">
                          Min 110%
                        </div>
                      </div>
                      <div
                        key={`${v.address}-6`}
                        className="min-w-0 border-b border-white/[0.04] px-4 py-4 transition-colors hover:bg-white/[0.032] sm:px-6"
                      >
                        <HealthBar value={v.healthFactor} variant="redemption" />
                      </div>
                      <div
                        key={`${v.address}-7`}
                        className="flex min-w-0 items-center border-b border-white/[0.04] px-4 py-4 transition-colors hover:bg-white/[0.032] sm:px-6"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            address ? setRedeemTarget(v) : openWalletModal()
                          }
                          className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all hover:-translate-y-px hover:opacity-85 ${
                            v.isOwn
                              ? "border border-green-500/22 bg-green-500/10 text-green-500"
                              : "border border-amber-500/22 bg-amber-500/10 text-amber-500"
                          }`}
                        >
                          {v.isOwn ? "Manage" : "Redeem"}
                        </button>
                      </div>
                    </Fragment>
                  )
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        /* History view - empty until real data is wired */
        <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
          <div className="grid grid-cols-[80px_70px_1fr_1fr_1fr_90px] gap-3 px-6 py-3">
            {[
              "Event",
              "Vault",
              "Collateral",
              "vUSD Burned",
              "Redeemed By",
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
          {redemptionHistory.length === 0 ? (
            <div className="border-t border-white/[0.04] px-6 py-12 text-center">
              <div className="mb-2 text-3xl">◎</div>
              <p className="text-sm text-zinc-500">
                No redemption history yet
              </p>
            </div>
          ) : (
            redemptionHistory.map((h) => (
              <div
                key={h.id}
                className="grid grid-cols-[80px_70px_1fr_1fr_1fr_90px] items-center gap-3 border-t border-white/[0.04] px-6 py-3.5 transition-colors hover:bg-white/[0.025]"
              >
                <div className="font-mono text-xs text-zinc-500">#{h.id}</div>
                <div className="font-mono text-xs text-zinc-500">#{h.vaultId}</div>
                <div>
                  <div className="font-mono text-[13px] text-zinc-200">
                    {h.collateral} WETH
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] text-zinc-500">
                    ${h.collateralUSD.toLocaleString()}
                  </div>
                </div>
                <div className="font-mono text-[13px] text-zinc-200">
                  {h.vUSDburned.toLocaleString()} vUSD
                </div>
                <div className="flex flex-col gap-1">
                  <Tag
                    color={h.type === "self" ? "#22c55e" : "#eab308"}
                    small
                  >
                    {h.type === "self" ? "You" : "External"}
                  </Tag>
                  <span className="font-mono text-[10px] text-zinc-500">
                    {h.redeemedBy}
                  </span>
                </div>
                <div className="font-mono text-[11px] text-zinc-500">
                  {h.resolvedAt}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed right-6 top-[76px] z-[300] flex min-w-[280px] items-center gap-2.5 rounded-xl border border-amber-500/30 bg-[#111113] px-4 py-3.5 shadow-lg animate-in slide-in-from-right-4 duration-300"
          role="status"
        >
          <div className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-amber-500/15 text-xs text-amber-500">
            ✓
          </div>
          <div>
            <div className="text-[13px] font-semibold text-zinc-100">
              {toast.msg}
            </div>
            {toast.sub && (
              <div className="mt-0.5 text-[11px] text-zinc-500">{toast.sub}</div>
            )}
          </div>
        </div>
      )}

      {/* Redeem modal */}
      {redeemTarget && (
        <RedeemModal
          vault={redeemTarget}
          walletVUSD={walletVUSD}
          wethPrice={wethPrice}
          onClose={() => setRedeemTarget(null)}
          onSuccess={() => {
            showToast(
              `Redemption confirmed on Vault #${redeemTarget.id}`,
              "Your transaction has been processed."
            )
          }}
        />
      )}
    </main>
  )
}
