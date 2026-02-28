"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { formatEther, formatUnits, parseUnits } from "viem"
import { erc20Abi } from "viem"
import { useAccount, useWriteContract } from "wagmi"

import {
  MAX_ALLOWANCE,
  vlendAddresses,
} from "@/config/blockchain"

import useAbi from "@/hooks/use-abi"
import useCollateralBalance from "@/hooks/use-collateral-balance"
import useInternalChainId from "@/hooks/use-internal-chain-id"
import useStabilityPool from "@/hooks/use-stability-pool"
import useStabilityPoolCollateralReward from "@/hooks/use-stability-pool-collateral-reward"
import useStabilityPoolRealTime from "@/hooks/use-stability-pool-realtime"
import useStatistics from "@/hooks/use-statistics"
import useTokenApproval from "@/hooks/use-token-approval"
import useVlendStaking from "@/hooks/use-vlend-staking"

import AmountInput from "@/components/ui/amount-input"
import FloatToPrettyNumber from "@/components/ui/floatToPrettyNumber"
import StatRow from "@/components/ui/stat-row"
import Tag from "@/components/ui/tag"
import TokenIcon from "@/components/ui/token-icon"
import TransactionDialog from "@/components/ui/interactions/transaction-dialog"

const VLEND_STAKING_ABI = [
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "stake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getReward",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const

type PoolTab = "stability" | "cashback"

export default function StabilityPoolPage() {
  const { address } = useAccount()
  const chainId = useInternalChainId()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const [poolTab, setPoolTab] = useState<PoolTab>(
    tabParam === "cashback" ? "cashback" : "stability"
  )

  useEffect(() => {
    if (tabParam === "cashback") setPoolTab("cashback")
  }, [tabParam])
  const [spDeposit, setSpDeposit] = useState("")
  const [spWithdraw, setSpWithdraw] = useState("")
  const [cbDeposit, setCbDeposit] = useState("")
  const [cbWithdraw, setCbWithdraw] = useState("")
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined)

  const { data: hash, writeContract, isPending } = useWriteContract()

  const stabilityPoolAbi = useAbi("StabilityPool")
  const mintableTokenAbi = useAbi("MintableToken")

  const { stabilityPoolOverview } = useStabilityPool()
  const { statistics } = useStatistics()
  const {
    stake: spStake,
    rewards: spVlendRewards,
    withdrawableDeposit,
    isLoading: spRealtimeLoading,
  } = useStabilityPoolRealTime()
  const { wethRewardHuman } = useStabilityPoolCollateralReward()
  const {
    vlendStaked,
    totalVlendStaked,
    rewardsHuman: cbRewardsHuman,
    isLoading: vlendStakingLoading,
  } = useVlendStaking()

  const vusdAddress = (mintableTokenAbi?.address ??
    vlendAddresses.mintableToken) as `0x${string}`

  const { balance: vusdBalance, decimals: vusdDecimals } =
    useCollateralBalance(vusdAddress)
  const { balance: vlendBalance, decimals: vlendDecimals } =
    useCollateralBalance(vlendAddresses.vlendToken as `0x${string}`)

  const spVusdApproval = useTokenApproval(
    vusdAddress,
    stabilityPoolAbi?.address as `0x${string}`,
    parseUnits(spDeposit || "0", vusdDecimals ?? 18)
  )
  const vlendApproval = useTokenApproval(
    vlendAddresses.vlendToken as `0x${string}`,
    vlendAddresses.vlendStaking,
    parseUnits(cbDeposit || "0", vlendDecimals ?? 18)
  )

  useEffect(() => {
    if (hash !== undefined) setTxHash(hash)
  }, [hash])

  const isStability = poolTab === "stability"

  const vusdBalanceHuman = vusdBalance
    ? formatUnits(vusdBalance, vusdDecimals ?? 18)
    : "0"
  const vlendBalanceHuman = vlendBalance
    ? formatUnits(vlendBalance, vlendDecimals ?? 18)
    : "0"
  const spWithdrawableHuman = formatEther(withdrawableDeposit ?? BigInt(0))
  const vlendStakedHuman = vlendStaked
    ? formatEther(vlendStaked)
    : "0"

  const totalSpTvl = parseFloat(
    stabilityPoolOverview?.totalVusdStakedHuman ?? "0"
  )
  const spStakeNum = parseFloat(formatEther(spStake ?? BigInt(0)))
  const spMyShare =
    totalSpTvl > 0 ? ((spStakeNum / totalSpTvl) * 100).toFixed(4) : "0"

  const totalVlendNum = totalVlendStaked
    ? parseFloat(formatEther(totalVlendStaked))
    : parseFloat(statistics?.VLENDinStaking ?? "0")
  const vlendStakedNum = parseFloat(vlendStakedHuman)
  const cbMyShare =
    totalVlendNum > 0
      ? ((vlendStakedNum / totalVlendNum) * 100).toFixed(4)
      : "0"

  const handleStabilityAction = () => {
    if (!stabilityPoolAbi?.abi || !stabilityPoolAbi?.address || !vusdDecimals)
      return

    if (spDeposit && parseFloat(spDeposit) > 0) {
      if (!spVusdApproval.isApproved) {
        writeContract({
          abi: erc20Abi,
          address: vusdAddress,
          chainId,
          functionName: "approve",
          args: [stabilityPoolAbi.address as `0x${string}`, MAX_ALLOWANCE],
        })
      } else {
        writeContract({
          abi: stabilityPoolAbi.abi,
          address: stabilityPoolAbi.address as `0x${string}`,
          chainId,
          functionName: "deposit",
          args: [parseUnits(spDeposit, vusdDecimals)],
          gas: BigInt(5_000_000),
        })
      }
    } else if (spWithdraw && parseFloat(spWithdraw) > 0) {
      writeContract({
        abi: stabilityPoolAbi.abi,
        address: stabilityPoolAbi.address as `0x${string}`,
        chainId,
        functionName: "withdraw",
        args: [parseUnits(spWithdraw, vusdDecimals)],
        gas: BigInt(5_000_000),
      })
    }
  }

  const handleCashbackAction = () => {
    if (!vlendDecimals) return

    if (cbDeposit && parseFloat(cbDeposit) > 0) {
      if (!vlendApproval.isApproved) {
        writeContract({
          abi: erc20Abi,
          address: vlendAddresses.vlendToken,
          chainId,
          functionName: "approve",
          args: [vlendAddresses.vlendStaking, MAX_ALLOWANCE],
        })
      } else {
        writeContract({
          abi: VLEND_STAKING_ABI,
          address: vlendAddresses.vlendStaking,
          chainId,
          functionName: "stake",
          args: [parseUnits(cbDeposit, vlendDecimals)],
        })
      }
    } else if (cbWithdraw && parseFloat(cbWithdraw) > 0) {
      writeContract({
        abi: VLEND_STAKING_ABI,
        address: vlendAddresses.vlendStaking,
        chainId,
        functionName: "withdraw",
        args: [parseUnits(cbWithdraw, vlendDecimals)],
      })
    }
  }

  const handleStabilityDepositChange = (v: string) => {
    setSpDeposit(v)
    if (v) setSpWithdraw("")
  }
  const handleStabilityWithdrawChange = (v: string) => {
    setSpWithdraw(v)
    if (v) setSpDeposit("")
  }
  const handleCashbackDepositChange = (v: string) => {
    setCbDeposit(v)
    if (v) setCbWithdraw("")
  }
  const handleCashbackWithdrawChange = (v: string) => {
    setCbWithdraw(v)
    if (v) setCbDeposit("")
  }

  const handleSpClaim = () => {
    if (
      stabilityPoolAbi?.abi &&
      stabilityPoolAbi?.address &&
      ((spVlendRewards ?? BigInt(0)) > BigInt(0) ||
        parseFloat(wethRewardHuman) > 0)
    ) {
      writeContract({
        abi: stabilityPoolAbi.abi,
        address: stabilityPoolAbi.address as `0x${string}`,
        chainId,
        functionName: "redeemReward",
      })
    }
  }

  const handleCbClaim = () => {
    if (parseFloat(cbRewardsHuman) > 0) {
      writeContract({
        abi: VLEND_STAKING_ABI,
        address: vlendAddresses.vlendStaking,
        chainId,
        functionName: "getReward",
      })
    }
  }

  const getCtaLabel = () => {
    if (!address) return "Connect Wallet to Continue"
    if (isStability) {
      if (spDeposit && parseFloat(spDeposit) > 0)
        return spVusdApproval.isApproved
          ? `Deposit ${spDeposit} vUSD`
          : "Approve vUSD"
      if (spWithdraw && parseFloat(spWithdraw) > 0) return `Withdraw ${spWithdraw} vUSD`
    } else {
      if (cbDeposit && parseFloat(cbDeposit) > 0)
        return vlendApproval.isApproved
          ? `Stake ${cbDeposit} VLEND`
          : "Approve VLEND"
      if (cbWithdraw && parseFloat(cbWithdraw) > 0)
        return `Unstake ${cbWithdraw} VLEND`
    }
    return "Enter an amount"
  }

  const hasStabilityAction =
    (spDeposit && parseFloat(spDeposit) > 0) ||
    (spWithdraw && parseFloat(spWithdraw) > 0)
  const hasCashbackAction =
    (cbDeposit && parseFloat(cbDeposit) > 0) ||
    (cbWithdraw && parseFloat(cbWithdraw) > 0)
  const canSubmit =
    (isStability && hasStabilityAction) || (!isStability && hasCashbackAction)

  const spHasRewards =
    (spVlendRewards ?? BigInt(0)) > BigInt(0) ||
    parseFloat(wethRewardHuman) > 0
  const cbHasRewards = parseFloat(cbRewardsHuman) > 0

  return (
    <main className="mx-auto max-w-[1100px] px-7 py-10">
      <div className="mb-8">
        <h1 className="mb-1 text-[22px] font-semibold tracking-tight">
          Stability Pool
        </h1>
        <p className="text-[13px] text-zinc-500">
          Deposit vUSD to backstop liquidations and earn rewards
        </p>
      </div>

      {/* Pool tabs */}
      <div className="mb-7 flex gap-2.5">
        {[
          {
            id: "stability" as PoolTab,
            label: "Stability Pool",
            sub: "vUSD Staking",
            icon: "◎",
          },
          {
            id: "cashback" as PoolTab,
            label: "Cashback Pool",
            sub: "VLEND Staking",
            icon: "◈",
          },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setPoolTab(t.id)}
            className={`flex items-center gap-2.5 rounded-xl px-5 py-3 transition-all ${
              poolTab === t.id
                ? "border border-green-500/30 bg-green-500/10"
                : "border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.05]"
            }`}
          >
            <span
              className={`text-base ${
                poolTab === t.id ? "text-green-500" : "text-zinc-500"
              }`}
            >
              {t.icon}
            </span>
            <div className="text-left">
              <div
                className={`text-[13px] font-semibold ${
                  poolTab === t.id ? "text-zinc-100" : "text-zinc-400"
                }`}
              >
                {t.label}
              </div>
              <div
                className={`mt-0.5 font-mono text-[10px] tracking-wide ${
                  poolTab === t.id ? "text-green-500" : "text-zinc-600"
                }`}
              >
                {t.sub}
              </div>
            </div>
            {poolTab === t.id && (
              <div className="ml-1.5 h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]" />
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_420px]">
        {/* Left: Action form */}
        <div className="overflow-hidden rounded-[18px] border border-white/[0.08] bg-white/[0.025]">
          <div className="flex items-start justify-between border-b border-white/[0.05] px-7 py-5">
            <div>
              <div className="mb-0.5 text-base font-semibold text-zinc-100">
                {isStability ? "Deposit & Withdraw" : "Stake & Unstake"}
              </div>
              <div className="text-xs text-zinc-500">
                {isStability
                  ? "Provide vUSD to the Stability Pool"
                  : "Stake VLEND to earn vUSD cashback"}
              </div>
            </div>
            <Tag>{isStability ? "vUSD" : "VLEND"}</Tag>
          </div>

          <div className="p-7">
            {isStability ? (
              <>
                <div className="mb-5">
                  <AmountInput
                    label="Deposit"
                    sublabel={!address ? "Connect wallet to see balance" : undefined}
                    value={spDeposit}
                    onChange={handleStabilityDepositChange}
                    max={address ? vusdBalanceHuman : undefined}
                    token="vUSD"
                    disabled={!address}
                  />
                </div>
                <div className="mb-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/[0.05]" />
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.05] text-xs text-zinc-500">
                    ↕
                  </div>
                  <div className="h-px flex-1 bg-white/[0.05]" />
                </div>
                <div className="mb-7">
                  <AmountInput
                    label="Withdraw"
                    value={spWithdraw}
                    onChange={handleStabilityWithdrawChange}
                    max={address ? spWithdrawableHuman : undefined}
                    token="vUSD"
                    disabled={!address}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="mb-5">
                  <AmountInput
                    label="Stake"
                    sublabel={!address ? "Connect wallet to see balance" : undefined}
                    value={cbDeposit}
                    onChange={handleCashbackDepositChange}
                    max={address ? vlendBalanceHuman : undefined}
                    token="VLEND"
                    disabled={!address}
                  />
                </div>
                <div className="mb-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/[0.05]" />
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.05] text-xs text-zinc-500">
                    ↕
                  </div>
                  <div className="h-px flex-1 bg-white/[0.05]" />
                </div>
                <div className="mb-7">
                  <AmountInput
                    label="Unstake"
                    value={cbWithdraw}
                    onChange={handleCashbackWithdrawChange}
                    max={address ? vlendStakedHuman : undefined}
                    token="VLEND"
                    disabled={!address}
                  />
                </div>
              </>
            )}

            <div className="mb-6 flex gap-2.5 rounded-[10px] border border-green-500/10 bg-green-500/5 p-4">
              <span className="mt-0.5 shrink-0 text-sm">ℹ</span>
              <p className="text-xs leading-relaxed text-zinc-400">
                {isStability
                  ? "Deposited vUSD absorbs liquidations and earns WETH collateral rewards plus VLEND incentives. Your balance may decrease during liquidations."
                  : "Staked VLEND earns a share of protocol revenues paid in vUSD. Rewards accrue continuously and can be claimed at any time."}
              </p>
            </div>

            {address ? (
              <button
                type="button"
                onClick={isStability ? handleStabilityAction : handleCashbackAction}
                disabled={!canSubmit || isPending || txHash !== undefined}
                className="w-full rounded-[11px] py-3.5 font-semibold text-white transition-all hover:opacity-90 hover:-translate-y-px disabled:pointer-events-none disabled:opacity-50"
                style={{
                  background:
                    canSubmit
                      ? "linear-gradient(135deg,#22c55e,#15803d)"
                      : "rgba(255,255,255,0.05)",
                  boxShadow: canSubmit
                    ? "0 0 24px rgba(34,197,94,0.2)"
                    : "none",
                }}
              >
                {isPending ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  getCtaLabel()
                )}
              </button>
            ) : (
              <div className="[&_button]:w-full [&_button]:rounded-[11px] [&_button]:border [&_button]:border-green-500/25 [&_button]:bg-green-500/10 [&_button]:py-3.5 [&_button]:font-semibold [&_button]:text-green-500 [&_button]:transition-colors hover:[&_button]:bg-green-500/20">
                <w3m-button />
              </div>
            )}
          </div>
        </div>

        {/* Right: Stats - column fills height, My Position expands */}
        <div className="flex min-h-0 flex-col gap-3.5 lg:min-h-full">
          {/* Protocol stats */}
          <div className="shrink-0 rounded-[18px] border border-white/[0.08] bg-white/[0.025] p-5">
            <div className="mb-1 text-sm font-semibold text-zinc-100">
              {isStability ? "Stability Pool Stats" : "Cashback Pool Stats"}
            </div>
            <div className="mb-5 text-xs text-zinc-500">
              {isStability
                ? "Protocol-wide overview"
                : "VLEND staking overview"}
            </div>

            {isStability && (
              <div className="mb-4 flex items-center justify-between rounded-xl border border-green-500/15 bg-green-500/5 px-4 py-4">
                <div>
                  <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                    Current APR
                  </div>
                  <div className="font-mono text-[28px] font-medium tracking-tight text-green-500">
                    {stabilityPoolOverview?.APR ?? "0.00"}%
                  </div>
                </div>
              </div>
            )}

            {isStability ? (
              <>
                <StatRow
                  label="Total vUSD Deposited"
                  value={
                    stabilityPoolOverview?.totalVusdStakedHuman
                      ? parseFloat(
                          stabilityPoolOverview.totalVusdStakedHuman
                        ).toLocaleString()
                      : "—"
                  }
                />
                <StatRow
                  label="Total VLEND Distributed"
                  value={
                    <FloatToPrettyNumber>
                      {stabilityPoolOverview?.totalVLENDRewardsHuman ?? "0"}
                    </FloatToPrettyNumber>
                  }
                />
                <StatRow label="Liquidations Absorbed" value="—" />
                <StatRow label="My Share of Pool" value={`${spMyShare}%`} />
              </>
            ) : (
              <>
                <StatRow
                  label="Total VLEND Staked"
                  value={
                    totalVlendStaked
                      ? parseFloat(formatEther(totalVlendStaked)).toLocaleString()
                      : statistics?.VLENDinStaking ?? "—"
                  }
                />
                <StatRow label="vUSD Rewards Paid (All Time)" value="—" />
                <StatRow
                  label="Current Yield Rate"
                  value="—"
                  highlight="#22c55e"
                />
                <StatRow label="My Share of Pool" value={`${cbMyShare}%`} />
              </>
            )}
          </div>

          {/* My Position - flex-1 to fill height and match left column */}
          <div className="flex min-h-0 flex-1 flex-col rounded-[18px] border border-white/[0.08] bg-white/[0.025] p-5">
            <div className="mb-5 shrink-0 text-sm font-semibold text-zinc-100">
              My Position
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2.5">
              <div className="rounded-[11px] bg-white/[0.03] p-3.5">
                <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                  {isStability ? "Deposited" : "Staked"}
                </div>
                <div
                  className={`font-mono text-xl ${
                    address ? "text-zinc-100" : "text-zinc-600"
                  }`}
                >
                  {address
                    ? isStability
                      ? spRealtimeLoading
                        ? "—"
                        : parseFloat(spWithdrawableHuman).toLocaleString(
                            undefined,
                            { maximumFractionDigits: 2 }
                          )
                      : vlendStakingLoading
                        ? "—"
                        : parseFloat(vlendStakedHuman).toLocaleString(
                            undefined,
                            { maximumFractionDigits: 2 }
                          )
                    : "—"}
                </div>
                <div className="mt-1 text-[11px] text-zinc-500">
                  {isStability ? "vUSD" : "VLEND"}
                </div>
              </div>
              <div className="rounded-[11px] border border-green-500/15 bg-green-500/5 p-3.5">
                <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                  Claimable
                </div>
                <div
                  className={`font-mono text-xl ${
                    address ? "text-green-500" : "text-zinc-600"
                  }`}
                >
                  {address
                    ? isStability
                      ? `${parseFloat(formatEther(spVlendRewards ?? BigInt(0))).toFixed(2)} VLEND`
                      : parseFloat(cbRewardsHuman).toFixed(2)
                    : "—"}
                </div>
                <div className="mt-1 text-[11px] text-zinc-500">
                  {isStability ? "VLEND + WETH" : "vUSD"}
                </div>
              </div>
            </div>

            {address && isStability && spHasRewards && (
              <div className="mb-3.5 rounded-[10px] bg-white/[0.02] p-3.5">
                <div className="mb-2 text-[11px] text-zinc-500">
                  Reward breakdown
                </div>
                <div className="mb-1.5 flex justify-between">
                  <span className="font-mono text-xs text-zinc-400">
                    WETH earned
                  </span>
                  <span className="font-mono text-xs text-zinc-200">
                    {parseFloat(wethRewardHuman).toFixed(4)} WETH
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-mono text-xs text-zinc-400">
                    VLEND earned
                  </span>
                  <span className="font-mono text-xs text-green-500">
                    {parseFloat(formatEther(spVlendRewards ?? BigInt(0))).toFixed(
                      2
                    )}{" "}
                    VLEND
                  </span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={isStability ? handleSpClaim : handleCbClaim}
              disabled={
                !address ||
                (isStability ? !spHasRewards : !cbHasRewards) ||
                isPending
              }
              className="w-full rounded-[10px] border py-3 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: address
                  ? "rgba(34,197,94,0.08)"
                  : "rgba(255,255,255,0.03)",
                borderColor: address
                  ? "rgba(34,197,94,0.22)"
                  : "rgba(255,255,255,0.06)",
                color: address ? "#22c55e" : "#52525b",
              }}
            >
              {address
                ? isStability
                  ? spHasRewards
                    ? `Claim ${parseFloat(formatEther(spVlendRewards ?? BigInt(0))).toFixed(2)} VLEND + ${parseFloat(wethRewardHuman).toFixed(4)} WETH`
                    : "No rewards to claim"
                  : cbHasRewards
                    ? `Claim ${parseFloat(cbRewardsHuman).toFixed(2)} vUSD`
                    : "No rewards to claim"
                : "No rewards to claim"}
            </button>
          </div>
        </div>
      </div>

      {txHash && (
        <TransactionDialog
          open={!!txHash}
          hash={txHash}
          onOpenChange={() => setTxHash(undefined)}
        />
      )}
    </main>
  )
}
