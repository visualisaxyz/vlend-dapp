"use client"

import React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { formatEther } from "viem"
import { Edit, User } from "lucide-react"
import { useAccount } from "wagmi"

import useCollaterals from "@/hooks/use-collaterals"
import useVault from "@/hooks/use-vault"
import useVaultRealTime from "@/hooks/use-vault-real-time"
import useVaultsByUser from "@/hooks/use-vaults-by-user"
import { ComboBox } from "@/components/ui/combo-box"
import FloatToCurrency from "@/components/ui/floatToCurrency"
import FloatToPrettyNumber from "@/components/ui/floatToPrettyNumber"
import HealthBar from "@/components/ui/health-bar"
import ChangeVaultName from "@/components/ui/interactions/change-vault-name"
import ProgressBar from "@/components/ui/progress-bar"
import SpinnerLoader from "@/components/ui/spinner-loader"
import TokenIcon from "@/components/ui/token-icon"
import ManageVaultPanel from "@/components/borrow/manage-vault-panel"
import { shortAddress } from "@/lib/utils"

export default function Vault() {
  const params = useParams()
  const slug = (params?.slug as string) ?? ""
  const { vault, isLoading } = useVault(slug, 30000)
  const { address } = useAccount()
  const router = useRouter()
  const { collaterals } = useCollaterals()
  const { vaultOwner: contractOwner, debt: contractDebt } = useVaultRealTime(
    slug as `0x${string}`
  )
  const ownerForVaults = vault?.owner ?? vault?.vaultOwner ?? contractOwner
  const { vaults, isLoading: isVaultsLoading } = useVaultsByUser(
    (ownerForVaults ?? "0x0000000000000000000000000000000000000000") as `0x${string}`
  )

  const isOwner = ownerForVaults?.toLowerCase() === address?.toLowerCase()

  const displayTvl = vault?.tvl ?? ""
  const displayDebt =
    vault?.debtHuman ??
    ((contractDebt != null ? formatEther(contractDebt) : "") ||
      (vault?.debt ? formatEther(BigInt(vault.debt)) : ""))
  const displayLiqThreshold = vault?.liquidationThreshold ?? ""
  const displayRedemptionThreshold = vault?.redemptionThreshold ?? ""

  const hf = parseFloat(
    vault?.healthFactor ?? vault?.liquidationFactor ?? "0"
  )
  const hfValid = !isNaN(hf) && isFinite(hf)

  if (isLoading) {
    return (
      <div className="container mt-20 flex items-center justify-center p-10 text-center text-sm">
        <ProgressBar />
      </div>
    )
  }

  if (!vault) {
    return (
      <main className="mx-auto max-w-[1180px] px-7 py-10">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 text-4xl">◎</div>
          <h2 className="mb-2 text-lg font-semibold text-zinc-100">
            Vault not found
          </h2>
          <p className="mb-6 text-sm text-zinc-500">
            This vault may not exist or the data could not be loaded.
          </p>
          <Link
            href="/vaults"
            className="rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-white/10"
          >
            Browse Vaults
          </Link>
        </div>
      </main>
    )
  }

  const vaultsForComboBox = vaults?.map((v) => ({
    value: v.address || "",
    label: v.name || "",
    icon: (
      <img
        alt=""
        src={`https://effigy.im/a/${v.address}.png`}
        width={16}
        height={16}
      />
    ),
  }))

  return (
    <main
      className="mx-auto max-w-[1180px] px-7 py-10"
      style={{ minHeight: "100vh" }}
    >
      {/* Page header */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="mb-1 text-[22px] font-semibold tracking-tight">
            Vault #{shortAddress(slug)}
          </h1>
          <p className="text-[13px] text-zinc-500">
            Manage collateral, borrow, and repay
          </p>
        </div>
        {address && isOwner && vaults && vaults.length > 1 && (
          <div className="flex items-center gap-2">
            <User size={16} className="text-zinc-500" />
            <ComboBox
              values={vaultsForComboBox ?? []}
              placeholder="Switch vault"
              defaultValue={slug}
              onValueChange={(value) => {
                if (value) router.push(`/vault/${value}`)
              }}
            />
            {isVaultsLoading && <SpinnerLoader />}
            <ChangeVaultName vault={vault.address as `0x${string}`}>
              <Edit
                className="cursor-pointer text-zinc-500 transition-colors hover:text-zinc-300"
                size={16}
              />
            </ChangeVaultName>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <div
          className="relative overflow-hidden rounded-[14px] border px-5 py-4"
          style={{
            background: "rgba(255,255,255,0.025)",
            borderColor: "rgba(255,255,255,0.07)",
          }}
        >
          <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
            Total Collateral
          </div>
          <div className="font-mono text-[22px] font-medium tracking-tight text-zinc-100">
            {displayTvl ? (
              <FloatToCurrency>{displayTvl}</FloatToCurrency>
            ) : (
              <span className="text-zinc-500">—</span>
            )}
          </div>
        </div>

        <div
          className="relative overflow-hidden rounded-[14px] border px-5 py-4"
          style={{
            background: "rgba(255,255,255,0.025)",
            borderColor: "rgba(255,255,255,0.07)",
          }}
        >
          <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
            Total Debt
          </div>
          <div className="font-mono text-[22px] font-medium tracking-tight text-zinc-100">
            {displayDebt ? (
              <FloatToCurrency>{displayDebt}</FloatToCurrency>
            ) : (
              <span className="text-zinc-500">—</span>
            )}
          </div>
        </div>

        <div
          className="rounded-[14px] border px-5 py-4"
          style={{
            background: "rgba(255,255,255,0.025)",
            borderColor: "rgba(255,255,255,0.07)",
          }}
        >
          <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
            Fees from Staking
          </div>
          <div className="font-mono text-[22px] font-medium tracking-tight text-zinc-100">
            <FloatToCurrency>0</FloatToCurrency>
          </div>
        </div>

        <div
          className={`relative overflow-hidden rounded-[14px] border px-5 py-4 ${
            hfValid && hf >= 1.5 ? "border-t-green-500/30" : ""
          }`}
          style={{
            background: "rgba(255,255,255,0.025)",
            borderColor:
              hfValid && hf >= 1.5
                ? "rgba(34,197,94,0.2)"
                : "rgba(255,255,255,0.07)",
          }}
        >
          {hfValid && hf >= 1.5 && (
            <div
              className="absolute left-0 right-0 top-0 h-0.5"
              style={{
                background: "linear-gradient(90deg,#22c55e,transparent)",
              }}
            />
          )}
          <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
            Health Factor
          </div>
          <div>
            {hfValid ? (
              <HealthBar value={hf} variant="redemption" />
            ) : (
              <span className="font-mono text-[22px] font-medium tracking-tight text-zinc-500">
                —
              </span>
            )}
          </div>
        </div>

        <div
          className="rounded-[14px] border px-5 py-4"
          style={{
            background: "rgba(255,255,255,0.025)",
            borderColor: "rgba(255,255,255,0.07)",
          }}
        >
          <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
            Vault Composition
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.isArray(vault.collateralInfo) &&
            vault.collateralInfo.length > 0 ? (
              vault.collateralInfo.map((info, index) => {
                const collateralAddress = vault.collaterals?.[index]
                const token = collaterals?.find(
                  (c) =>
                    c.address.toLowerCase() ===
                    collateralAddress?.toLowerCase()
                )
                if (!collateralAddress || !token) return null
                return (
                  <div
                    key={collateralAddress}
                    className="flex items-center gap-2"
                  >
                    <TokenIcon
                      symbol={token.tokenName}
                      width={24}
                      height={24}
                    />
                    <div>
                      <span className="font-mono text-sm font-medium text-zinc-100">
                        <FloatToPrettyNumber>{info.amount ?? 0}</FloatToPrettyNumber>
                      </span>
                      <span className="ml-1 font-mono text-[11px] text-zinc-500">
                        ~
                        <FloatToCurrency>{info.valueInUsd ?? 0}</FloatToCurrency>
                      </span>
                    </div>
                  </div>
                )
              })
            ) : (
              <span className="font-mono text-[22px] font-medium tracking-tight text-zinc-500">
                —
              </span>
            )}
          </div>
        </div>

        <div
          className="rounded-[14px] border px-5 py-4"
          style={{
            background: "rgba(255,255,255,0.025)",
            borderColor: "rgba(255,255,255,0.07)",
          }}
        >
          <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
            Liquidation Threshold
          </div>
          <div className="font-mono text-[22px] font-medium tracking-tight text-zinc-100">
            {displayLiqThreshold ? (
              <FloatToCurrency>{displayLiqThreshold}</FloatToCurrency>
            ) : (
              <span className="text-zinc-500">—</span>
            )}
          </div>
        </div>

        <div
          className="rounded-[14px] border px-5 py-4"
          style={{
            background: "rgba(255,255,255,0.025)",
            borderColor: "rgba(255,255,255,0.07)",
          }}
        >
          <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
            Redemption Threshold
          </div>
          <div className="font-mono text-[22px] font-medium tracking-tight text-zinc-100">
            {displayRedemptionThreshold ? (
              <FloatToCurrency>{displayRedemptionThreshold}</FloatToCurrency>
            ) : (
              <span className="text-zinc-500">—</span>
            )}
          </div>
        </div>

        <div
          className="rounded-[14px] border px-5 py-4"
          style={{
            background: "rgba(255,255,255,0.025)",
            borderColor: "rgba(255,255,255,0.07)",
          }}
        >
          <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
            Fee
          </div>
          <div className="font-mono text-[22px] font-medium tracking-tight text-zinc-100">
            0.50%
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
        {/* Left: Manage panel or read-only */}
        <div
          className="overflow-hidden rounded-[18px] border p-6"
          style={{
            background: "rgba(255,255,255,0.025)",
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          {isOwner ? (
            <ManageVaultPanel
              vaultAddress={slug}
              onBack={() => router.push("/vaults")}
              compact
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-[14px] text-2xl"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                🔒
              </div>
              <div className="mb-2 text-base font-semibold text-zinc-100">
                {address
                  ? "You are not the owner of this vault"
                  : "Connect wallet to manage"}
              </div>
              <p className="mb-6 max-w-[280px] text-[13px] text-zinc-500">
                {address
                  ? "This vault belongs to another address. Connect with the owner wallet to deposit, withdraw, borrow, or repay."
                  : "Connect your wallet to manage this vault if you are the owner."}
              </p>
              {!address && <w3m-button />}
            </div>
          )}
        </div>

        {/* Right: Sidebar */}
        <div className="flex flex-col gap-3.5">
          <div
            className="rounded-[18px] border px-5 py-5"
            style={{
              background: "rgba(255,255,255,0.025)",
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <div className="mb-1 text-sm font-semibold text-zinc-100">
              Health Factor Guide
            </div>
            <div className="mb-5 text-xs text-zinc-500">
              Keep your vault above 1.5 to stay safe
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
                <span className="max-w-[150px] text-right text-[11px] text-zinc-500">
                  {desc}
                </span>
              </div>
            ))}
          </div>

          <Link
            href="/vaults"
            className="rounded-[10px] border px-4 py-3 text-center text-[13px] font-semibold text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-zinc-300"
            style={{
              background: "rgba(255,255,255,0.02)",
              borderColor: "rgba(255,255,255,0.06)",
            }}
          >
            ← Back to Vaults
          </Link>
        </div>
      </div>
    </main>
  )
}
