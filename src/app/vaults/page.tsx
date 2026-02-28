"use client"

import React, { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CircleFadingPlusIcon, Search } from "lucide-react"
import { useAccount } from "wagmi"

import { vlendAddresses } from "@/config/blockchain"
import useAbi from "@/hooks/use-abi"
import useCollaterals from "@/hooks/use-collaterals"
import useStatistics from "@/hooks/use-statistics"
import useVaultsList, { type VaultList } from "@/hooks/use-vaults-list"
import { mapVaultListToCard } from "@/lib/vault-utils"
import ProgressBar from "@/components/ui/progress-bar"
import TokenIcon from "@/components/ui/token-icon"
import VaultCard, { type VaultCardData } from "@/components/ui/vault-card"

export default function Vaults() {
  const { vaults, isLoading, vaultsTvl, totalTvl } = useVaultsList()
  const { statistics, isLoading: isLoadingStatistics } = useStatistics()
  const { collaterals, isLoading: isLoadingCollaterals } = useCollaterals()
  const { address } = useAccount()
  const router = useRouter()

  const [hideZeroDebt, setHideZeroDebt] = React.useState(true)
  const [selectedUser, setSelectedUser] = React.useState("")

  const vlendAbi = useAbi("VLEND")
  const vusdAbi = useAbi("MintableToken")

  useEffect(() => {
    if (address) {
      setSelectedUser(address)
      setHideZeroDebt(false)
    }
  }, [address])

  if (isLoading || isLoadingCollaterals || isLoadingStatistics) {
    return (
      <div className="container mt-20 flex items-center justify-center p-10 text-center text-sm">
        <ProgressBar />
      </div>
    )
  }

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

  let sortedVaults = Array.isArray(vaults)
    ? [...vaults].sort((a, b) => parseFloat(b.tvl) - parseFloat(a.tvl))
    : []

  if (hideZeroDebt) {
    sortedVaults = sortedVaults.filter(
      (vault) => parseFloat(vault.debt) > 0
    )
  }

  if (selectedUser) {
    sortedVaults = sortedVaults.filter(
      (vault) =>
        vault.vaultOwner?.toLowerCase() === selectedUser.toLowerCase()
    )
  }

  const vaultCards: VaultCardData[] = sortedVaults.map((v: VaultList) =>
    mapVaultListToCard(v, redemptionLimit, wethPrice)
  )

  const userVaultCount = address
    ? vaults.filter(
        (v: VaultList) =>
          v.vaultOwner?.toLowerCase() === address.toLowerCase()
      ).length
    : 0

  return (
    <main
      className="mx-auto max-w-[1180px] px-7 py-10"
      style={{ minHeight: "100vh" }}
    >
      {/* Page header */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="mb-1 text-[22px] font-semibold tracking-tight">
            Vaults
          </h1>
          <p className="text-[13px] text-zinc-500">
            Browse all protocol vaults. Create one or manage your existing
            positions.
          </p>
        </div>
        {address && (
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="flex cursor-default items-center gap-2 rounded-[10px] px-5 py-2.5 text-[13px] font-semibold text-white opacity-80"
              style={{
                background: "linear-gradient(135deg,#22c55e,#15803d)",
                boxShadow: "0 0 20px rgba(34,197,94,0.2)",
              }}
              title="Coming soon"
            >
              <TokenIcon symbol="vUSD" invert={false} />
              Buy vUSD
            </span>
            <Link
              href="/vaults/create"
              className="flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
              style={{
                background: "linear-gradient(135deg,#22c55e,#15803d)",
                boxShadow: "0 0 20px rgba(34,197,94,0.2)",
              }}
            >
              <CircleFadingPlusIcon className="h-4 w-4" />
              Create new Vault
            </Link>
            <button
              type="button"
              onClick={async () => {
                await window.ethereum?.request({
                  method: "wallet_watchAsset",
                  params: {
                    type: "ERC20",
                    options: {
                      address:
                        vlendAbi?.address ?? vlendAddresses.vlendToken,
                      decimals: "18",
                    },
                  },
                })
              }}
              className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm font-semibold text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-zinc-300"
            >
              <TokenIcon symbol="metamask" />
              Add VLEND
            </button>
            <button
              type="button"
              onClick={async () => {
                await window.ethereum?.request({
                  method: "wallet_watchAsset",
                  params: {
                    type: "ERC20",
                    options: {
                      address:
                        vusdAbi?.address ?? vlendAddresses.mintableToken,
                      decimals: "18",
                    },
                  },
                })
              }}
              className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm font-semibold text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-zinc-300"
            >
              <TokenIcon symbol="metamask" />
              Add vUSD
            </button>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div
          className="rounded-[14px] border px-5 py-4"
          style={{
            background: "rgba(255,255,255,0.025)",
            borderColor: "rgba(255,255,255,0.07)",
          }}
        >
          <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
            Total Vaults
          </div>
          <div className="font-mono text-[22px] font-medium tracking-tight text-zinc-100">
            {vaults.length}
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
            Total TVL
          </div>
          <div className="font-mono text-[22px] font-medium tracking-tight text-zinc-100">
            ${((totalTvl ?? vaultsTvl ?? 0) / 10).toLocaleString()}
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
            Your Vaults
          </div>
          <div className="font-mono text-[22px] font-medium tracking-tight text-zinc-100">
            {address ? userVaultCount : "—"}
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
            Protocol vUSD
          </div>
          <div className="font-mono text-[22px] font-medium tracking-tight text-zinc-100">
            {statistics?.circulatingVUSD
              ? parseFloat(statistics.circulatingVUSD).toLocaleString()
              : "—"}
          </div>
        </div>
      </div>

      {/* Vault cards grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {vaultCards.length === 0 ? (
          <div
            className="col-span-full flex flex-col items-center justify-center rounded-2xl border px-6 py-12 text-center"
            style={{
              background: "rgba(255,255,255,0.025)",
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <div className="mb-4 text-4xl">◎</div>
            <p className="mb-2 text-base font-medium text-zinc-100">
              {selectedUser
                ? "You do not have any vaults yet"
                : "No vaults match your filters"}
            </p>
            <p className="mb-6 text-sm text-zinc-500">
              {selectedUser
                ? "Create your first vault to start borrowing."
                : "Try adjusting filters or create a new vault."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/vaults/create"
                className="flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                style={{
                  background: "linear-gradient(135deg,#22c55e,#15803d)",
                  boxShadow: "0 0 20px rgba(34,197,94,0.2)",
                }}
              >
                <CircleFadingPlusIcon className="h-4 w-4" />
                Create your first Vault
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSelectedUser("")
                  setHideZeroDebt(true)
                }}
                className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm font-semibold text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-zinc-300"
              >
                <Search className="h-4 w-4" />
                Explore all vaults
              </button>
            </div>
          </div>
        ) : (
          vaultCards.map((vault) => (
            <VaultCard
              key={vault.address}
              vault={vault}
              onManage={(v) => router.push(`/vault/${v.address}`)}
            />
          ))
        )}
      </div>
    </main>
  )
}
