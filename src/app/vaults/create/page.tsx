"use client"

import { useEffect, useState } from "react"
import { useAccount } from "wagmi"

import useCollaterals from "@/hooks/use-collaterals"
import useStatistics from "@/hooks/use-statistics"
import useVaultsList, { type VaultList } from "@/hooks/use-vaults-list"
import { mapVaultListToCard } from "@/lib/vault-utils"

import CreateVaultPanel from "@/components/borrow/create-vault-panel"
import ManageVaultPanel from "@/components/borrow/manage-vault-panel"
import VaultCard, { type VaultCardData } from "@/components/ui/vault-card"
import Tag from "@/components/ui/tag"
import TokenIcon from "@/components/ui/token-icon"

export default function BorrowPage() {
  const { address } = useAccount()
  const { vaults: allVaults, isLoading: vaultsLoading } = useVaultsList()
  const { statistics } = useStatistics()
  const { collaterals } = useCollaterals()

  const [panel, setPanel] = useState<"overview" | "create" | VaultCardData>("overview")

  const userVaults: VaultList[] = address
    ? allVaults.filter(
        (v: VaultList) => v.vaultOwner?.toLowerCase() === address.toLowerCase()
      )
    : []

  const redemptionLimit = parseFloat(
    statistics?.healthFactor?.redemptionLimit ?? "1.5"
  )

  const wethCollateral = collaterals?.find(
    (c) =>
      c.tokenName?.toUpperCase() === "WETH" ||
      c.address?.toLowerCase() ===
        "0x4200000000000000000000000000000000000006"
  )
  const wethPrice = parseFloat(wethCollateral?.price ?? "3100")

  const vaultCards: VaultCardData[] = userVaults.map((v) =>
    mapVaultListToCard(v, redemptionLimit, wethPrice)
  )

  const totalCollUSD = userVaults.reduce(
    (s, v) => s + parseFloat(v.tvl || "0"),
    0
  )
  const totalDebt = userVaults.reduce(
    (s, v) => s + parseFloat(v.debtHuman || "0"),
    0
  )
  const netPosition = totalCollUSD - totalDebt
  const totalCollateralWeth =
    wethPrice > 0 ? totalCollUSD / wethPrice : 0

  const atRiskVault = vaultCards.find((v) => v.status === "warning")

  const panelTitle =
    panel === "create"
      ? "New Vault"
      : typeof panel === "object"
        ? `Manage Vault #${panel.id}`
        : "My Vaults"

  return (
    <main
      className="mx-auto max-w-[1180px] px-7 py-10"
      style={{ minHeight: "100vh" }}
    >
      {/* Page header */}
      <div className="mb-7">
        <h1 className="mb-1 text-[22px] font-semibold tracking-tight">
          Borrow
        </h1>
        <p className="text-[13px] text-zinc-500">
          Deposit collateral and mint vUSD at a minimum 110% collateral ratio
        </p>
      </div>

      {/* How it works */}
      <div
        className="mb-5 flex w-full items-center gap-2 rounded-[14px] border px-6 py-3.5"
        style={{
          background: "rgba(255,255,255,0.015)",
          borderColor: "rgba(255,255,255,0.06)",
        }}
      >
        {[
          { icon: "🔒", label: "Deposit Collateral", desc: "Locked as collateral", color: "#22c55e" },
          null,
          { icon: "⚡", label: "Mint vUSD", desc: "Borrow at 110%+ CR", color: "#22c55e" },
          null,
          { icon: "📊", label: "Monitor HF", desc: "Stay above 1.5 safely", color: "#eab308" },
          null,
          { icon: "💸", label: "Repay & Withdraw", desc: "Burn vUSD to reclaim", color: "#3b82f6" },
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

      {!address ? (
        /* Disconnected state */
        <div className="mt-2 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div
            className="flex flex-col gap-5 rounded-[18px] border px-8 py-9"
            style={{
              background: "rgba(255,255,255,0.025)",
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <div
              className="flex h-12 w-12 items-center justify-center rounded-[14px] text-[22px]"
              style={{
                background: "linear-gradient(135deg,#22c55e,#15803d)",
                boxShadow: "0 0 24px rgba(34,197,94,0.3)",
              }}
            >
              🔐
            </div>
            <div>
              <div className="mb-2 text-lg font-semibold text-zinc-100">
                Connect to start borrowing
              </div>
              <div className="text-[13px] leading-relaxed text-zinc-500">
                Deposit collateral and mint vUSD, vLend&apos;s decentralized
                stablecoin. Maintain your health factor above 1.5 to stay safe
                from redemptions.
              </div>
            </div>
            <div className="[&_button]:rounded-lg [&_button]:border [&_button]:border-white/10 [&_button]:bg-white/5 [&_button]:px-3.5 [&_button]:py-1.5 [&_button]:text-xs [&_button]:font-semibold [&_button]:text-zinc-400 [&_button]:transition-all hover:[&_button]:border-primary/45 hover:[&_button]:bg-primary/10 hover:[&_button]:text-primary">
              <w3m-button />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div
              className="rounded-[14px] border px-5 py-4"
              style={{
                background: "rgba(255,255,255,0.02)",
                borderColor: "rgba(255,255,255,0.07)",
              }}
            >
              <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                Protocol TVL
              </div>
              <div className="font-mono text-[26px] font-semibold text-zinc-100">
                ${(statistics?.tvl ? parseFloat(statistics.tvl) : 0).toLocaleString()}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "vUSD Supply",
                  value: `${(statistics?.circulatingVUSD ? parseFloat(statistics.circulatingVUSD) : 0).toLocaleString()} vUSD`,
                },
                { label: "Active Vaults", value: String(statistics?.totalVaultsCreated ?? 0) },
                { label: "Min CR", value: "110%" },
                { label: "Borrow Fee", value: "0.5%" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border px-4 py-3"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    borderColor: "rgba(255,255,255,0.07)",
                  }}
                >
                  <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    {s.label}
                  </div>
                  <div className="font-mono text-base text-zinc-200">
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Connected state */
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_380px]">
          {/* Left column */}
          <div className="flex flex-col gap-4">
            {/* Summary cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                {
                  label: "Net Position",
                  value: `$${netPosition.toLocaleString()}`,
                  sub: "collateral − debt",
                  accent: true,
                },
                {
                  label: "Total Collateral",
                  value: `$${totalCollUSD.toLocaleString()}`,
                  sub: `${totalCollateralWeth.toFixed(2)} WETH`,
                },
                {
                  label: "Total Debt",
                  value: `${totalDebt.toLocaleString()} vUSD`,
                  sub: "outstanding",
                },
              ].map((c) => (
                <div
                  key={c.label}
                  className="relative overflow-hidden rounded-[14px] border px-4 py-4"
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    borderColor: c.accent
                      ? "rgba(34,197,94,0.2)"
                      : "rgba(255,255,255,0.07)",
                  }}
                >
                  {c.accent && (
                    <div
                      className="absolute left-0 right-0 top-0 h-0.5"
                      style={{
                        background: "linear-gradient(90deg,#22c55e,transparent)",
                      }}
                    />
                  )}
                  <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    {c.label}
                  </div>
                  <div
                    className="font-mono text-xl font-semibold"
                    style={{ color: c.accent ? "#22c55e" : "#f4f4f5" }}
                  >
                    {c.value}
                  </div>
                  <div className="font-mono text-[10px] text-zinc-500 mt-1">
                    {c.sub}
                  </div>
                </div>
              ))}
            </div>

            {/* WETH price ticker */}
            <div
              className="flex items-center justify-between rounded-[10px] border px-4 py-2.5"
              style={{
                background: "rgba(255,255,255,0.02)",
                borderColor: "rgba(255,255,255,0.06)",
              }}
            >
              <div className="flex items-center gap-2">
                <TokenIcon symbol="WETH" width={22} height={22} />
                <span className="font-mono text-xs text-zinc-400">
                  WETH / USD
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold text-zinc-100">
                  ${wethPrice.toLocaleString()}
                </span>
                <Tag color="#22c55e" small>
                  Live
                </Tag>
              </div>
            </div>

            {/* Vault cards */}
            <div className="flex flex-col gap-3">
              {vaultsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : vaultCards.length === 0 ? (
                <div
                  className="rounded-2xl border px-6 py-8 text-center"
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    borderColor: "rgba(255,255,255,0.08)",
                  }}
                >
                  <p className="text-sm text-zinc-500">
                    No vaults yet. Create your first vault to start borrowing.
                  </p>
                </div>
              ) : (
                vaultCards.map((v) => (
                  <VaultCard
                    key={v.address}
                    vault={v}
                    onManage={(vault) => setPanel(vault)}
                  />
                ))
              )}
            </div>

            {/* At-risk warning */}
            {atRiskVault && (
              <div
                className="flex items-center justify-between gap-4 rounded-xl border px-4 py-3.5"
                style={{
                  background: "rgba(234,179,8,0.05)",
                  borderColor: "rgba(234,179,8,0.2)",
                }}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">⚠️</span>
                  <div>
                    <div className="mb-0.5 text-[13px] font-semibold text-amber-200">
                      Vault #{atRiskVault.id} is at risk of redemption
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      HF {atRiskVault.healthFactor.toFixed(2)} — anyone can
                      redeem vUSD against this vault. Deposit more or repay debt.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPanel(atRiskVault)}
                  className="shrink-0 rounded-lg border px-3.5 py-2 text-xs font-semibold text-amber-400"
                  style={{
                    background: "rgba(234,179,8,0.1)",
                    borderColor: "rgba(234,179,8,0.25)",
                  }}
                >
                  Fix Now →
                </button>
              </div>
            )}
          </div>

          {/* Right panel - sticky */}
          <div
            className="sticky top-[78px] rounded-[18px] border p-6"
            style={{
              background: "rgba(255,255,255,0.025)",
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="text-[15px] font-semibold text-zinc-100">
                {panelTitle}
              </div>
              {panel !== "overview" && (
                <button
                  type="button"
                  onClick={() => setPanel("overview")}
                  className="rounded-md border px-2.5 py-1 text-xs text-zinc-500"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    borderColor: "rgba(255,255,255,0.08)",
                  }}
                >
                  Overview
                </button>
              )}
            </div>

            {panel === "overview" && (
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setPanel("create")}
                  className="rounded-xl py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{
                    background: "linear-gradient(135deg,#22c55e,#15803d)",
                    boxShadow: "0 0 22px rgba(34,197,94,0.2)",
                  }}
                >
                  + New Vault
                </button>
                <div
                  className="rounded-xl border px-4 py-3.5"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    borderColor: "rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="mb-3 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                    Protocol
                  </div>
                  {[
                    ["TVL", `$${(statistics?.tvl ? parseFloat(statistics.tvl) : 0).toLocaleString()}`],
                    ["Active Vaults", String(statistics?.totalVaultsCreated ?? 0)],
                    ["vUSD Supply", `${(statistics?.circulatingVUSD ? parseFloat(statistics.circulatingVUSD) : 0).toLocaleString()}`],
                    ["Borrow Fee", "0.5%"],
                    ["Min CR", "110%"],
                  ].map(([l, v]) => (
                    <div
                      key={String(l)}
                      className="mb-2 flex justify-between last:mb-0"
                    >
                      <span className="text-xs text-zinc-500">{l}</span>
                      <span className="font-mono text-xs text-zinc-400">
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
                <div
                  className="rounded-xl border px-4 py-3.5"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    borderColor: "rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="mb-3 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                    Health Factor Guide
                  </div>
                  {[
                    ["≥ 1.5", "Safe — below redemption zone", "#22c55e"],
                    ["1.3 – 1.5", "At risk of redemption", "#eab308"],
                    ["1.1 – 1.3", "High risk — urgent action", "#f97316"],
                    ["< 1.1", "Liquidation imminent", "#ef4444"],
                  ].map(([range, desc, color]) => (
                    <div
                      key={String(range)}
                      className="mb-2 flex justify-between items-start last:mb-0"
                    >
                      <span
                        className="font-mono text-[11px]"
                        style={{ color }}
                      >
                        {range}
                      </span>
                      <span
                        className="text-[11px] text-zinc-500 text-right max-w-[150px]"
                      >
                        {desc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {panel === "create" && (
              <CreateVaultPanel onSuccess={() => setPanel("overview")} />
            )}

            {typeof panel === "object" && (
              <ManageVaultPanel
                vaultAddress={panel.address}
                onBack={() => setPanel("overview")}
              />
            )}
          </div>
        </div>
      )}
    </main>
  )
}
