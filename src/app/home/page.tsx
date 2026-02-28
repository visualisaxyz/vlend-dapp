"use client"

import Link from "next/link"
import { formatEther } from "viem"
import { useAccount } from "wagmi"

import useCollaterals from "@/hooks/use-collaterals"
import usePrices from "@/hooks/use-prices"
import useRedeemableVaultsMerged, {
  type RedeemableVaultMerged,
} from "@/hooks/use-redeemable-vaults-merged"
import useStatistics from "@/hooks/use-statistics"
import useStabilityPool from "@/hooks/use-stability-pool"
import useStabilityPoolRealTime from "@/hooks/use-stability-pool-realtime"
import useVaultsList, { type VaultList } from "@/hooks/use-vaults-list"
import { shortAddress } from "@/lib/utils"

import FloatToPrettyNumber from "@/components/ui/floatToPrettyNumber"
import HealthBar from "@/components/ui/health-bar"
import { Skeleton } from "@/components/ui/skeleton"
import Tag from "@/components/ui/tag"

export default function Home() {
  const { address } = useAccount()
  const { vaults: allVaults, totalTvl, isLoading: vaultsLoading } = useVaultsList()
  const { statistics, isLoading: statisticsLoading } = useStatistics()
  const { stabilityPoolOverview } = useStabilityPool()
  const { stake, rewards, isLoading: spRealtimeLoading } = useStabilityPoolRealTime()
  const { collaterals } = useCollaterals()
  const { prices } = usePrices()
  const { redeemableVaults, isLoading: redeemableLoading } =
    useRedeemableVaultsMerged()

  const userVaults: VaultList[] = address
    ? allVaults.filter(
        (v: VaultList) =>
          v.vaultOwner?.toLowerCase() === address.toLowerCase()
      )
    : []

  const wethCollateral = collaterals?.find(
    (c) =>
      c.tokenName?.toUpperCase() === "WETH" ||
      c.address?.toLowerCase() ===
        "0x4200000000000000000000000000000000000006"
  )
  const wethPrice = parseFloat(wethCollateral?.price ?? "3100")

  const totalCollateralUSD = userVaults.reduce(
    (s: number, v: VaultList) => s + parseFloat(v.tvl || "0"),
    0
  )
  const totalDebt = userVaults.reduce(
    (s: number, v: VaultList) => s + parseFloat(v.debtHuman || "0"),
    0
  )
  const netWorth = totalCollateralUSD - totalDebt
  const totalCollateralWeth =
    wethPrice > 0 ? totalCollateralUSD / wethPrice : 0

  const stakeHuman = stake ? parseFloat(formatEther(stake)) : 0
  const rewardsHuman = rewards ? parseFloat(formatEther(rewards)) : 0

  const circulatingVusd = parseFloat(
    statistics?.circulatingVUSD ?? "0"
  )
  const spTvl = parseFloat(
    stabilityPoolOverview?.totalVusdStakedHuman ?? "0"
  )
  const poolUtilization =
    circulatingVusd > 0 ? (spTvl / circulatingVusd) * 100 : 0

  const mcr = statistics?.collateralData?.[0]?.mcr ?? 110
  const statsTvl = statistics?.tvl ? parseFloat(statistics.tvl) : 0
  const protocolTvlRaw =
    statsTvl > 0 ? statsTvl : (totalTvl ?? 0)
  // API/vaults return TVL scaled by 10; display in actual units
  const protocolTvl = protocolTvlRaw / 10

  const redemptionLimit = statistics?.healthFactor?.redemptionLimit ?? "1.5"
  const protectionThresholdPct = parseFloat(redemptionLimit).toFixed(1)
  // Use actual vault list length when available; stats API can be stale
  const totalVaults =
    allVaults.length > 0
      ? allVaults.length
      : (statistics?.totalVaultsCreated ?? 0)
  const vlendStaked = parseFloat(statistics?.VLENDinStaking ?? "0")
  const vlendPrice = Number(prices?.VLEND ?? 0)

  const statCards = [
    {
      label: "Net Position",
      value: `$${netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      sub: "Collateral minus debt",
      accent: true,
      vc: "text-green-500",
    },
    {
      label: "Total Collateral",
      value: `$${totalCollateralUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      sub: `${totalCollateralWeth.toFixed(2)} WETH deposited`,
      vc: "",
    },
    {
      label: "vUSD Minted",
      value: totalDebt.toLocaleString(undefined, { maximumFractionDigits: 0 }),
      sub: `Across ${userVaults.length} active vaults`,
      vc: "",
    },
    {
      label: "VLEND Rewards",
      value: `${rewardsHuman.toFixed(2)} VLEND`,
      sub: "Ready to claim",
      vc: "text-amber-500",
    },
  ]

  // Order: row1 = Protocol TVL, VLEND Staked, vUSD Staked, WETH/USD | row2 = Total Vaults, VLEND Price, vUSD Price, Protection Threshold
  const protocolStats = [
    {
      label: "Protocol TVL",
      value:
        protocolTvl >= 1e6
          ? `$${(protocolTvl / 1e6).toFixed(1)}M`
          : `$${protocolTvl.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
    },
    {
      label: "VLEND Staked",
      value:
        vlendStaked >= 1e6
          ? `${(vlendStaked / 1e6).toFixed(2)}M`
          : vlendStaked.toLocaleString(undefined, { maximumFractionDigits: 2 }),
    },
    {
      label: "vUSD Staked",
      value:
        spTvl >= 1e6 ? `$${(spTvl / 1e6).toFixed(1)}M` : `$${spTvl.toLocaleString()}`,
    },
    {
      label: "WETH / USD",
      value: `$${wethPrice.toLocaleString()}`,
    },
    {
      label: "Total Vaults",
      value: totalVaults.toLocaleString(),
    },
    {
      label: "VLEND Price",
      value: `$${vlendPrice.toFixed(4)}`,
    },
    {
      label: "vUSD Price",
      value: "$1.00",
    },
    {
      label: "Protection Threshold",
      value: `${protectionThresholdPct}%`,
    },
  ]

  return (
    <main className="mx-auto max-w-[1180px] px-7 py-9">
      {/* Page header */}
      <div className="mb-7">
        <h1 className="mb-1 text-[22px] font-semibold tracking-tight">
          Dashboard
        </h1>
        <p className="text-[13px] text-zinc-500">
          Your portfolio overview · MegaETH Mainnet
        </p>
      </div>

      {/* Stat cards */}
      <div className="mb-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((c) => (
          <div
            key={c.label}
            className={`relative overflow-hidden rounded-[14px] border px-5 py-5 ${
              c.accent
                ? "border-green-500/25 bg-white/[0.025]"
                : "border-white/[0.07] bg-white/[0.025]"
            }`}
          >
            {c.accent && (
              <div
                className="absolute left-0 right-0 top-0 h-0.5 rounded-t-[14px]"
                style={{
                  background: "linear-gradient(90deg,#22c55e,#15803d)",
                }}
              />
            )}
            <div className="mb-2.5 text-[11px] font-medium uppercase tracking-widest text-zinc-500">
              {c.label}
            </div>
            <div
              className={`font-mono text-[22px] font-medium leading-none tracking-tight ${c.vc || "text-zinc-100"}`}
            >
              {c.value}
            </div>
            <div className="mt-1.5 text-[11px] text-zinc-600">
              {c.sub}
            </div>
          </div>
        ))}
      </div>

      {/* My Vaults - full width */}
      <div className="mb-3.5 overflow-x-auto overflow-y-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
          <div className="flex items-center justify-between border-b border-white/[0.05] px-6 py-4">
            <span className="text-sm font-semibold text-zinc-200">
              My Vaults
            </span>
            <Tag>{userVaults.length} Active</Tag>
          </div>

          {!address ? (
            <div className="flex flex-col items-center justify-center gap-4 px-6 py-12">
              <p className="text-sm text-zinc-500">
                Connect your wallet to view your vaults
              </p>
              <w3m-button />
            </div>
          ) : vaultsLoading ? (
            <div className="flex items-center justify-center px-6 py-12">
              <Skeleton className="h-8 w-32" />
            </div>
          ) : userVaults.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 px-6 py-12">
              <p className="text-sm text-zinc-500">
                You don&apos;t have any vaults yet
              </p>
              <Link
                href="/vaults/create"
                className="rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-2.5 text-sm font-semibold text-green-500 transition-colors hover:bg-green-500/20"
              >
                Open New Vault
              </Link>
            </div>
          ) : (
            <>
              <div className="min-w-[640px]">
                <div className="grid grid-cols-[minmax(56px,64px)_minmax(110px,1.2fr)_minmax(80px,1fr)_minmax(130px,1.2fr)_minmax(90px,100px)] gap-4 px-4 py-2.5 sm:px-6">
                  {["ID", "Collateral", "Debt (vUSD)", "Health Factor", ""].map(
                    (h) => (
                      <div
                        key={h}
                        className="font-mono text-[10px] uppercase tracking-widest text-zinc-600"
                      >
                        {h}
                      </div>
                    )
                  )}
                </div>
                {userVaults.map((v) => (
                  <VaultRow key={v.address} vault={v} wethPrice={wethPrice} />
                ))}
              </div>
              <div className="border-t border-white/[0.04] px-6 py-3.5">
                <Link
                  href="/vaults/create"
                  className="block w-full rounded-lg border border-green-500/20 bg-green-500/10 py-2.5 text-center text-sm font-semibold text-green-500 transition-colors hover:bg-green-500/20"
                >
                  Open New Vault →
                </Link>
              </div>
            </>
          )}
      </div>

      {/* Stability Pool & Live Auctions - equal size cards side by side */}
      <div className="mb-3.5 grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        {/* Stability Pool */}
        <div className="flex min-h-[280px] flex-col rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
            <div className="mb-4 text-sm font-semibold text-zinc-200">
              Stability Pool
            </div>
            <div className="mb-3.5 grid grid-cols-2 gap-2.5">
              <div className="rounded-[10px] bg-white/[0.03] p-3.5">
                <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                  My Deposit
                </div>
                <div className="font-mono text-xl text-zinc-200">
                  {spRealtimeLoading ? (
                    <Skeleton className="h-6 w-16" />
                  ) : (
                    <FloatToPrettyNumber>{stakeHuman}</FloatToPrettyNumber>
                  )}
                </div>
                <div className="mt-1 text-[11px] text-zinc-500">vUSD</div>
              </div>
              <div className="rounded-[10px] border border-green-500/15 bg-green-500/5 p-3.5">
                <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                  Claimable
                </div>
                <div className="font-mono text-xl text-green-500">
                  {spRealtimeLoading ? (
                    <Skeleton className="h-6 w-12" />
                  ) : (
                    rewardsHuman.toFixed(2)
                  )}
                </div>
                <div className="mt-1 text-[11px] text-zinc-500">VLEND</div>
              </div>
            </div>
            <div className="mb-3.5">
              <div className="mb-1.5 flex justify-between">
                <span className="text-[11px] text-zinc-500">
                  Pool utilization
                </span>
                <span className="font-mono text-[11px] text-zinc-400">
                  {poolUtilization.toFixed(0)}%
                </span>
              </div>
              <div className="h-[3px] rounded-sm bg-white/[0.06]">
                <div
                  className="h-full rounded-sm"
                  style={{
                    width: `${Math.min(poolUtilization, 100)}%`,
                    background: "linear-gradient(90deg,#22c55e,#15803d)",
                  }}
                />
              </div>
            </div>
            <div className="mt-auto flex gap-2">
              <Link
                href="/stability-pool"
                className="flex-1 rounded-lg border border-green-500/25 bg-green-500/10 py-2 text-center text-sm font-semibold text-green-500 transition-colors hover:bg-green-500/20"
              >
                Deposit
              </Link>
              <Link
                href="/stability-pool"
                className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.04] py-2 text-center text-sm font-semibold text-zinc-400 transition-colors hover:bg-white/[0.06]"
              >
                Claim
              </Link>
            </div>
        </div>

        {/* Live Redemptions */}
        <div className="flex min-h-[280px] flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
            <div className="flex items-center justify-between border-b border-white/[0.04] px-5 py-4">
              <span className="text-sm font-semibold text-zinc-200">
                Live Redemptions
              </span>
              <Tag color="#eab308">
                {redeemableVaults.length} Redeemable
              </Tag>
            </div>
            {redeemableLoading ? (
              <div className="flex flex-1 items-center justify-center px-5 py-8">
                <Skeleton className="h-8 w-24" />
              </div>
            ) : redeemableVaults.length === 0 ? (
              <div className="flex flex-1 items-center justify-center px-5 py-8">
                <p className="text-sm text-zinc-500">
                  No vaults in redemption zone
                </p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto">
                  {redeemableVaults.map((v) => (
                    <RedeemableVaultRow key={v.address} vault={v} />
                  ))}
                </div>
                <div className="border-t border-white/[0.04] px-5 py-3">
                  <Link
                    href="/redemptions"
                    className="block w-full rounded-lg border border-amber-500/20 bg-amber-500/10 py-2 text-center text-sm font-semibold text-amber-500 transition-colors hover:bg-amber-500/20"
                  >
                    View Redemptions →
                  </Link>
                </div>
              </>
            )}
        </div>
      </div>

      {/* Protocol stats - 8 cards in two rows */}
      <div className="grid grid-cols-2 gap-0 rounded-[14px] border border-white/[0.07] bg-white/[0.02] sm:grid-cols-4">
        {protocolStats.map((s, i) => (
          <div
            key={s.label}
            className={`border-white/[0.05] px-4 py-4 text-center sm:px-5 ${
              i % 2 !== 1 ? "border-r" : "border-r-0 sm:border-r"
            } ${i % 4 === 3 ? "sm:border-r-0" : ""} ${
              i < 4 ? "border-b" : ""
            }`}
          >
            <div className="mb-1 font-mono text-base font-medium text-zinc-200">
              {statisticsLoading ? (
                <Skeleton className="mx-auto h-5 w-16" />
              ) : (
                s.value
              )}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}

function VaultRow({
  vault,
  wethPrice,
}: {
  vault: VaultList
  wethPrice: number
}) {
  const tvl = parseFloat(vault.tvl || "0")
  const collateralWeth = wethPrice > 0 ? tvl / wethPrice : 0
  const healthFactor = parseFloat(vault.healthFactor || "1")

  return (
    <Link
      href={`/vault/${vault.address}`}
      className="grid grid-cols-[minmax(56px,64px)_minmax(110px,1.2fr)_minmax(80px,1fr)_minmax(130px,1.2fr)_minmax(90px,100px)] items-center gap-4 border-t border-white/[0.04] px-4 py-3.5 transition-colors hover:bg-white/[0.035] sm:px-6"
    >
      <div className="min-w-0 overflow-hidden truncate font-mono text-xs text-zinc-600">
        #{shortAddress(vault.address)}
      </div>
      <div className="flex min-w-0 flex-col gap-0.5 overflow-hidden leading-tight">
        <div className="font-mono text-[13px] text-zinc-200">
          {collateralWeth.toFixed(2)} WETH
        </div>
        <div className="font-mono text-[10px] text-zinc-500">
          ${tvl.toLocaleString()}
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-0.5 overflow-hidden leading-tight">
        <div className="font-mono text-[13px] text-zinc-200">
          {parseFloat(vault.debtHuman || "0").toLocaleString()}
        </div>
        <div className="font-mono text-[10px] text-zinc-500">vUSD</div>
      </div>
      <div className="min-w-0 shrink-0">
        <HealthBar value={healthFactor} compact />
      </div>
      <span className="flex-shrink-0 rounded-lg border border-green-500/20 bg-green-500/10 px-2 py-1.5 text-center text-[11px] font-semibold text-green-500 transition-colors hover:bg-green-500/20">
        Manage
      </span>
    </Link>
  )
}

function RedeemableVaultRow({ vault }: { vault: RedeemableVaultMerged }) {
  return (
    <Link
      href="/redemptions"
      className="flex items-center justify-between border-b border-white/[0.04] px-5 py-3.5 transition-colors hover:bg-white/[0.03]"
    >
      <div>
        <div className="font-mono text-xs text-zinc-200">
          Vault #{vault.id}
          {vault.isOwn && (
            <span className="ml-1.5 text-[10px] text-amber-500">(Yours)</span>
          )}
        </div>
        <div className="mt-0.5 font-mono text-[10px] text-zinc-500">
          {vault.collateral.toFixed(2)} {vault.collateralTokenSymbol} · $
          {vault.collateralUSD.toLocaleString()}
        </div>
      </div>
      <div className="text-right">
        <div className="font-mono text-[11px] text-zinc-400">
          {vault.debtVUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })} vUSD
        </div>
        <div className="mt-0.5">
          <HealthBar value={vault.healthFactor} compact />
        </div>
      </div>
    </Link>
  )
}
