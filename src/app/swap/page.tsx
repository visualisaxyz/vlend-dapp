"use client"

import { useEffect, useState } from "react"
import { formatUnits, parseUnits } from "viem"
import { erc20Abi } from "viem"
import { useAccount, useWriteContract } from "wagmi"

import { MAX_ALLOWANCE, vlendAddresses } from "@/config/blockchain"
import { txHashLink } from "@/lib/utils"
import useCollateralBalance from "@/hooks/use-collateral-balance"
import useInternalChainId from "@/hooks/use-internal-chain-id"
import useStabilizer from "@/hooks/use-stabilizer"
import useStatistics from "@/hooks/use-statistics"
import useTokenApproval from "@/hooks/use-token-approval"

import StatRow from "@/components/ui/stat-row"
import Tag from "@/components/ui/tag"
import TokenInput from "@/components/ui/token-input"

const STABILIZER_WRITE_ABI = [
  {
    inputs: [{ name: "_amount", type: "uint256" }],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "_amount", type: "uint256" }],
    name: "burn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const

type Mode = "mint" | "burn"

export default function StabilizerPage() {
  const { address } = useAccount()
  const chainId = useInternalChainId()
  const [mode, setMode] = useState<Mode>("mint")
  const [amount, setAmount] = useState("")
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined)
  const [txSuccess, setTxSuccess] = useState(false)

  const {
    collateralToken,
    feeBps,
    scalingFactor,
    totalUsdmInContract,
    feeBpsNum,
    isLoading: stabilizerLoading,
  } = useStabilizer()

  const { statistics } = useStatistics()
  const { data: hash, writeContract, isPending } = useWriteContract()

  const vusdAddress = vlendAddresses.mintableToken as `0x${string}`
  const collateralAddress =
    (collateralToken && collateralToken !== "0x"
      ? collateralToken
      : undefined) as `0x${string}` | undefined

  const { balance: usdmBalance, decimals: usdmDecimals } =
    useCollateralBalance(collateralAddress)
  const { balance: vusdBalance, decimals: vusdDecimals } =
    useCollateralBalance(vusdAddress)

  const usdmBalanceNum = usdmBalance
    ? parseFloat(formatUnits(usdmBalance, usdmDecimals ?? 18))
    : 0
  const vusdBalanceNum = vusdBalance
    ? parseFloat(formatUnits(vusdBalance, vusdDecimals ?? 18))
    : 0

  const collateralApproval = useTokenApproval(
    collateralAddress,
    vlendAddresses.stabilizer as `0x${string}`,
    mode === "mint" && amount
      ? parseUnits(amount, usdmDecimals ?? 18)
      : undefined
  )
  const vusdApproval = useTokenApproval(
    vusdAddress,
    vlendAddresses.stabilizer as `0x${string}`,
    mode === "burn" && amount ? parseUnits(amount, vusdDecimals ?? 18) : undefined
  )

  useEffect(() => {
    if (hash !== undefined) {
      setTxHash(hash)
      setTxSuccess(true)
      setAmount("")
      const t = setTimeout(() => setTxSuccess(false), 4000)
      return () => clearTimeout(t)
    }
  }, [hash])

  const isMint = mode === "mint"
  const numAmount = parseFloat(amount) || 0
  const scalingNum = Number(scalingFactor) || 1

  const fee =
    isMint
      ? (numAmount * feeBpsNum) / 10000
      : (numAmount / scalingNum) * (feeBpsNum / 10000)
  const youReceive = isMint ? numAmount - fee : numAmount / scalingNum - fee
  const feeDisplay = fee > 0 ? fee.toFixed(4) : "0.00"
  const receiveDisplay = youReceive > 0 ? youReceive.toFixed(4) : "0.00"

  const handleSubmit = () => {
    if (!numAmount || !address) return
    if (isMint && !collateralAddress) return

    const amountWei = parseUnits(amount, 18)
    const stabilizerAddr = vlendAddresses.stabilizer as `0x${string}`

    if (isMint) {
      if (!collateralApproval.isApproved) {
        writeContract({
          abi: erc20Abi,
          address: collateralAddress!,
          chainId,
          functionName: "approve",
          args: [stabilizerAddr, MAX_ALLOWANCE],
        })
      } else {
        writeContract({
          abi: STABILIZER_WRITE_ABI,
          address: stabilizerAddr,
          chainId,
          functionName: "mint",
          args: [amountWei],
        })
      }
    } else {
      if (!vusdApproval.isApproved) {
        writeContract({
          abi: erc20Abi,
          address: vusdAddress,
          chainId,
          functionName: "approve",
          args: [stabilizerAddr, MAX_ALLOWANCE],
        })
      } else {
        writeContract({
          abi: STABILIZER_WRITE_ABI,
          address: stabilizerAddr,
          chainId,
          functionName: "burn",
          args: [amountWei],
        })
      }
    }
  }

  const hasEnoughBalance = isMint
    ? usdmBalanceNum >= numAmount
    : vusdBalanceNum >= numAmount
  const canSubmit = numAmount > 0 && hasEnoughBalance

  const ctaText = isPending
    ? "Confirming..."
    : !address
      ? ""
      : numAmount === 0
        ? "Enter an amount"
        : isMint
          ? !collateralApproval.isApproved
            ? "Approve USDm"
            : `Mint ${numAmount.toLocaleString()} vUSD`
          : !vusdApproval.isApproved
            ? "Approve vUSD"
            : `Burn ${numAmount.toLocaleString()} vUSD`

  const circulatingVusd = statistics?.circulatingVUSD ?? "0"
  const explorerLink = txHash ? txHashLink(chainId, txHash) : ""
  const feePct = (feeBpsNum / 100).toFixed(2)

  return (
    <div className="min-h-screen bg-background text-zinc-100">
      {/* Toast */}
      {txSuccess && txHash && (
        <div
          className="fixed right-6 top-[76px] z-[200] flex items-center gap-2.5 rounded-xl border border-green-500/30 bg-[#111113] p-3.5 shadow-xl animate-in slide-in-from-right-4"
          role="status"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/15 text-[11px] text-green-500">
            ✓
          </div>
          <div>
            <div className="text-[13px] font-semibold text-zinc-100">
              Transaction submitted
            </div>
            <a
              href={explorerLink}
              target="_blank"
              rel="noreferrer"
              className="mt-0.5 block text-[11px] text-zinc-500 hover:text-zinc-400"
            >
              View on MegaETH Explorer ↗
            </a>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-[1100px] px-7 py-10">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="mb-1 text-[22px] font-semibold tracking-tight">
            Stabilizer
          </h1>
          <p className="text-[13px] text-zinc-500">
            Mint or burn vUSD 1:1 against USDm to maintain the peg
          </p>
        </div>

        {/* One unified card block */}
        <div className="overflow-hidden rounded-[18px] border border-white/[0.08] bg-white/[0.025]">
          <div className="grid grid-cols-1 items-stretch gap-0 lg:grid-cols-[1fr_340px]">
            {/* Left: Swap + My Balances */}
            <div className="flex flex-col gap-4 p-4 sm:p-5 lg:gap-5 lg:p-6">
              {/* Swap Card */}
              <div className="rounded-[14px] border border-white/[0.06] bg-white/[0.02]">
            {/* Header with mode toggle */}
            <div className="flex items-center justify-between border-b border-white/[0.05] px-7 py-5">
              <div>
                <div className="mb-0.5 text-base font-semibold text-zinc-100">
                  {isMint ? "Mint vUSD" : "Burn vUSD"}
                </div>
                <div className="text-xs text-zinc-500">
                  {isMint
                    ? "Deposit USDm, receive vUSD"
                    : "Return vUSD, receive USDm"}
                </div>
              </div>
              <div className="flex gap-0.5 rounded-[10px] border border-white/[0.08] bg-white/[0.04] p-0.5">
                {(["mint", "burn"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMode(m)
                      setAmount("")
                    }}
                    className={`rounded-md px-4 py-1.5 text-xs font-semibold capitalize transition-all ${
                      mode === m
                        ? m === "mint"
                          ? "border border-green-500/30 bg-green-500/15 text-zinc-100"
                          : "border border-red-500/25 bg-red-500/12 text-zinc-100"
                        : "border border-transparent text-zinc-500"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-7">
              {/* You Pay */}
              <TokenInput
                label="You Pay"
                token={isMint ? "USDm" : "vUSD"}
                tokenColor={isMint ? "#3b82f6" : "#22c55e"}
                value={amount}
                onChange={setAmount}
                max={address ? (isMint ? usdmBalanceNum : vusdBalanceNum) : undefined}
              />

              {/* Swap arrow */}
              <div className="my-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode(isMint ? "burn" : "mint")
                    setAmount("")
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.09] bg-white/[0.04] text-base text-zinc-500 transition-colors hover:border-green-500/30 hover:bg-green-500/12 hover:text-green-500"
                >
                  ⇅
                </button>
              </div>

              {/* You Receive */}
              <TokenInput
                label="You Receive"
                token={isMint ? "vUSD" : "USDm"}
                tokenColor={isMint ? "#22c55e" : "#3b82f6"}
                value={receiveDisplay !== "0.00" ? receiveDisplay : ""}
                readonly
                note={`After ${feePct}% fee`}
              />

              {/* Fee breakdown */}
              {numAmount > 0 && (
                <div className="my-5 rounded-[10px] border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Rate</span>
                    <span className="font-mono text-zinc-400">
                      1 {isMint ? "USDm" : "vUSD"} = 1 {isMint ? "vUSD" : "USDm"}
                    </span>
                  </div>
                  <div className="mt-1.5 flex justify-between text-xs">
                    <span className="text-zinc-500">
                      Protocol Fee ({feePct}%)
                    </span>
                    <span className="font-mono text-zinc-400">
                      −{feeDisplay} {isMint ? "vUSD" : "USDm"}
                    </span>
                  </div>
                  <div className="my-0.5 h-px bg-white/[0.05]" />
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-zinc-400">
                      You receive
                    </span>
                    <span className="font-mono font-medium text-green-500">
                      {receiveDisplay} {isMint ? "vUSD" : "USDm"}
                    </span>
                  </div>
                </div>
              )}

              {/* CTA */}
              {address ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={
                    !canSubmit ||
                    isPending ||
                    stabilizerLoading ||
                    (isMint && !collateralToken)
                  }
                  className={`mt-5 w-full rounded-[11px] py-3.5 text-sm font-semibold transition-all ${
                    canSubmit
                      ? isMint
                        ? "bg-gradient-to-br from-green-500 to-green-700 text-white shadow-[0_0_24px_rgba(34,197,94,0.2)] hover:opacity-90 hover:-translate-y-px"
                        : "bg-gradient-to-br from-red-500 to-red-700 text-white shadow-[0_0_24px_rgba(239,68,68,0.2)] hover:opacity-90 hover:-translate-y-px"
                      : "cursor-default border border-white/[0.07] bg-white/[0.04] text-zinc-500"
                  }`}
                >
                  {ctaText}
                </button>
              ) : (
                <div className="mt-5 [&_button]:w-full [&_button]:rounded-[11px] [&_button]:py-3.5 [&_button]:text-sm [&_button]:font-semibold [&_button]:border [&_button]:border-green-500/22 [&_button]:bg-green-500/8 [&_button]:text-green-500">
                  <w3m-button />
                </div>
              )}
            </div>
              </div>

              {/* My Balances - expanded on left */}
              <div className="flex-1 rounded-[14px] border border-white/[0.06] bg-white/[0.02] p-5">
                <div className="mb-4 text-sm font-semibold text-zinc-100">
                  My Balances
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[11px] border border-blue-500/12 bg-blue-500/5 p-4">
                    <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                      USDm
                    </div>
                    <div
                      className={`font-mono text-xl ${address ? "text-zinc-200" : "text-zinc-600"}`}
                    >
                      {address ? usdmBalanceNum.toLocaleString() : "—"}
                    </div>
                  </div>
                  <div className="rounded-[11px] border border-green-500/12 bg-green-500/5 p-4">
                    <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                      vUSD
                    </div>
                    <div
                      className={`font-mono text-xl ${address ? "text-green-500" : "text-zinc-600"}`}
                    >
                      {address ? vusdBalanceNum.toLocaleString() : "—"}
                    </div>
                  </div>
                </div>
                {!address && (
                  <div className="mt-4 [&_button]:w-full [&_button]:rounded-lg [&_button]:py-2.5 [&_button]:text-xs [&_button]:font-semibold [&_button]:border [&_button]:border-green-500/15 [&_button]:bg-green-500/6 [&_button]:text-green-500">
                    <w3m-button />
                  </div>
                )}
              </div>
            </div>

            {/* Right column: Peg + Params - fills height to match left */}
            <div className="flex min-h-0 flex-col gap-0 border-l border-white/[0.05] lg:min-h-full lg:gap-0">
              <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-5 lg:p-6">
                {/* vUSD Peg Status */}
                <div className="shrink-0 rounded-[14px] border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <div className="mb-0.5 text-sm font-semibold text-zinc-100">
                    vUSD Peg
                  </div>
                  <div className="text-xs text-zinc-500">
                    Current market price
                  </div>
                </div>
                <Tag color="#22c55e">Stable</Tag>
              </div>
              <div className="mb-3.5 flex items-baseline gap-2">
                <span className="font-mono text-4xl font-medium tracking-tight text-green-500">
                  $1.00
                </span>
                <span className="font-mono text-[13px] text-green-500/70">
                  —%
                </span>
              </div>
              <div className="mb-1.5">
                <div className="mb-1.5 flex justify-between">
                  <span className="font-mono text-[10px] text-zinc-600">
                    $0.995
                  </span>
                  <span className="font-mono text-[10px] text-green-500">
                    $1.00 target
                  </span>
                  <span className="font-mono text-[10px] text-zinc-600">
                    $1.005
                  </span>
                </div>
                <div className="relative h-1.5 rounded-sm bg-white/[0.05]">
                  <div className="absolute left-[20%] right-[20%] top-0 bottom-0 rounded-sm bg-green-500/12" />
                  <div className="absolute left-1/2 top-[-2px] bottom-[-2px] w-0.5 -translate-x-1/2 rounded-sm bg-green-500/40" />
                  <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.7)]" />
                </div>
              </div>
              <div className="mt-4">
                <StatRow
                  label="24h Volume (Stabilizer)"
                  value="—"
                />
                <StatRow
                  label="Total USDm in Contract"
                  value={
                    totalUsdmInContract
                      ? parseFloat(totalUsdmInContract).toLocaleString()
                      : "—"
                  }
                />
                <StatRow
                  label="vUSD Total Supply"
                  value={
                    circulatingVusd
                      ? parseFloat(circulatingVusd).toLocaleString()
                      : "—"
                  }
                  border={false}
                />
              </div>
                </div>

                {/* Contract Parameters - flex-1 to fill height and match left column */}
                <div className="mt-4 flex min-h-0 flex-1 flex-col rounded-[14px] border border-white/[0.06] bg-white/[0.02] p-5">
                  <div className="mb-4 shrink-0 text-sm font-semibold text-zinc-100">
                    Contract Parameters
                  </div>
                  <div className="flex-1">
                  <StatRow
                    label="Protocol Fee"
                    value={`${feePct}% (${feeBpsNum} bps)`}
                  />
                  <StatRow label="Collateral Token" value="USDm" />
                  <StatRow label="Mint Token" value="vUSD" />
                  <StatRow
                    label="Scaling Factor"
                    value={scalingNum === 1 ? "1:1" : String(scalingNum)}
                    border={false}
                  />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-7">
          <div className="mb-4 text-[13px] font-semibold uppercase tracking-wider text-zinc-500">
            How it works
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="flex gap-3.5">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-green-500/15 bg-green-500/8 text-sm">
                ↑
              </div>
              <div>
                <div className="mb-1 text-[13px] font-semibold text-zinc-200">
                  Mint vUSD
                </div>
                <div className="text-xs leading-relaxed text-zinc-500">
                  Deposit USDm collateral and receive vUSD minus the protocol
                  fee. Used to bring vUSD back to peg when it trades below $1.
                </div>
              </div>
            </div>
            <div className="flex gap-3.5">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-red-500/15 bg-red-500/7 text-sm">
                ↓
              </div>
              <div>
                <div className="mb-1 text-[13px] font-semibold text-zinc-200">
                  Burn vUSD
                </div>
                <div className="text-xs leading-relaxed text-zinc-500">
                  Return vUSD and receive USDm collateral back minus the protocol
                  fee. Used to reduce vUSD supply when it trades above $1.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
