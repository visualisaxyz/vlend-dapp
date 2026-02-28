"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Check } from "lucide-react"
import { erc20Abi, formatUnits } from "viem"
import { useAccount, useReadContract, useWriteContract } from "wagmi"

import { MAX_ALLOWANCE } from "@/config/blockchain"
import { txHashLink } from "@/lib/utils"
import useAbi from "@/hooks/use-abi"
import useCollateralBalance from "@/hooks/use-collateral-balance"
import useInternalChainId from "@/hooks/use-internal-chain-id"
import useTokenApproval from "@/hooks/use-token-approval"
import type { RedeemableVaultMerged } from "@/hooks/use-redeemable-vaults-merged"

import SpinnerLoader from "./spinner-loader"
import TokenIcon from "./token-icon"
import TransactionWrapper from "./interactions/transaction-wrapper"

const MCR = 1.1

function getUrgencyColor(hf: number) {
  return hf < 1.15 ? "#ef4444" : hf < 1.3 ? "#f97316" : "#eab308"
}

type RedeemModalProps = {
  vault: RedeemableVaultMerged
  walletVUSD?: number
  wethPrice?: number
  onClose: () => void
  onSuccess?: () => void
}

export default function RedeemModal({
  vault,
  walletVUSD = 5000,
  wethPrice = 3100,
  onClose,
  onSuccess,
}: RedeemModalProps) {
  const [percentage, setPercentage] = useState(0)
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined)

  const vaultAbi = useAbi("Vault")
  const chainId = useInternalChainId()
  const { address } = useAccount()
  const stableAbi = useAbi("MintableToken")
  const vaultFactoryAbi = useAbi("VaultFactory")

  const collateral = (
    vault.collateralToken ||
    "0x4200000000000000000000000000000000000006"
  ) as `0x${string}`
  const vaultAddress = vault.address as `0x${string}`

  const collateralData = useCollateralBalance(collateral, vaultAddress, false)

  const redeemableValueBN = BigInt(vault.maxReedemable)
  let realRedeemableValue = redeemableValueBN
  if (collateralData.balance && redeemableValueBN > collateralData.balance) {
    realRedeemableValue = collateralData.balance
  }
  const collateralAmount =
    (realRedeemableValue * BigInt(percentage)) / BigInt(100)

  const calcRedeem = useReadContract({
    abi: vaultAbi?.abi,
    address: vaultAddress,
    chainId: chainId,
    functionName: "calcRedeem",
    args: [collateral, collateralAmount],
    query: {
      refetchIntervalInBackground: true,
      refetchInterval: 5000,
    },
  })

  let payAmount = BigInt(0)
  let debtRepaid = BigInt(0)
  if (calcRedeem.data !== undefined && calcRedeem.data !== null) {
    const redeemData = calcRedeem.data as Array<bigint>
    if (redeemData.length > 1) {
      payAmount = redeemData[0] + redeemData[1]
      debtRepaid = redeemData[0]
    }
  }

  const { isApproved } = useTokenApproval(
    stableAbi?.address || "0x",
    vaultFactoryAbi?.address || "0x",
    payAmount
  )

  const { data: hash, writeContract } = useWriteContract()

  useEffect(() => {
    setTxHash(hash)
  }, [hash])

  useEffect(() => {
    if (isApproved && txHash !== undefined) {
      setTxHash(undefined)
    }
  }, [isApproved])

  const debt = useReadContract({
    abi: vaultAbi?.abi,
    address: vaultAddress,
    chainId: chainId,
    functionName: "debt",
    query: { refetchIntervalInBackground: true, refetchInterval: 5000 },
  })

  useEffect(() => {
    if (debt.data !== undefined && debt.data !== null) {
      if (debtRepaid > (debt.data as bigint)) {
        setPercentage((p) => Math.max(0, p - 5))
      }
    }
  }, [debtRepaid, debt.data])

  const payAmountHuman = formatUnits(payAmount, 18)
  const collateralOutHuman =
    collateralData.decimals != null
      ? formatUnits(collateralAmount, collateralData.decimals)
      : "0"
  const collateralOutUSD =
    parseFloat(collateralOutHuman) * wethPrice
  const maxRedeemable =
    Math.min(vault.debtVUSD, walletVUSD)
  const isValid = percentage > 0 && parseFloat(payAmountHuman) <= maxRedeemable
  const urgencyColor = getUrgencyColor(vault.healthFactor)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (
      !vaultFactoryAbi.address ||
      !vaultFactoryAbi.abi ||
      !stableAbi.address ||
      !address
    )
      return

    if (isApproved) {
      writeContract({
        abi: vaultFactoryAbi.abi,
        address: vaultFactoryAbi.address,
        chainId: chainId,
        functionName: "redeem",
        args: [vaultAddress, collateral, collateralAmount, address],
      })
    } else {
      writeContract({
        abi: erc20Abi,
        address: stableAbi.address,
        chainId: chainId,
        functionName: "approve",
        args: [vaultFactoryAbi.address, MAX_ALLOWANCE],
      })
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-[14px] animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[460px] rounded-[20px] border border-white/10 bg-[#111113] p-[30px] shadow-2xl animate-in zoom-in-95 duration-200"
      >
        <TransactionWrapper txHash={txHash} status="success">
          <div className="flex flex-col items-center space-y-2 py-4">
            <div className="text-sm text-zinc-200">
              Your transaction has been processed.
            </div>
            <Check className="h-6 w-6 text-green-500" />
            <Link
              href={txHashLink(chainId, txHash ?? "")}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-lime-500 transition-colors hover:underline"
            >
              View on block explorer
            </Link>
            <button
              type="button"
              onClick={() => {
                onSuccess?.()
                onClose()
              }}
              className="mt-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-white/15"
            >
              Close
            </button>
          </div>
        </TransactionWrapper>

        <TransactionWrapper txHash={txHash} status="pending">
          <div className="flex flex-col items-center space-y-2 py-4">
            <div className="text-sm text-zinc-200">
              Your transaction is being processed.
            </div>
            <SpinnerLoader />
            <Link
              href={txHashLink(chainId, txHash ?? "")}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-lime-500 transition-colors hover:underline"
            >
              View on block explorer
            </Link>
          </div>
        </TransactionWrapper>

        <TransactionWrapper txHash={hash} status="error">
          <div className="flex flex-col items-center space-y-2 py-4">
            <div className="text-sm text-red-400">
              There was an error processing your transaction.
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium"
            >
              Close
            </button>
          </div>
        </TransactionWrapper>

        <TransactionWrapper txHash={txHash}>
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="mb-5 flex items-start justify-between">
              <div>
                <div className="mb-1 text-[17px] font-semibold text-zinc-100">
                  {vault.isOwn ? "Redeem Your Vault" : "Redeem Against Vault"}
                </div>
                <div className="text-xs text-zinc-500">
                  Vault #{vault.id} · HF{" "}
                  <span style={{ color: urgencyColor }}>
                    {vault.healthFactor.toFixed(2)}
                  </span>{" "}
                  · {vault.isOwn ? "Your vault" : vault.owner}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/8 bg-white/[0.06] text-base leading-none text-zinc-500 transition-colors hover:bg-white/10"
              >
                ×
              </button>
            </div>

            {/* Vault snapshot */}
            <div className="mb-5 grid grid-cols-3 gap-2">
              {[
                {
                  label: "Collateral",
                  val: `${vault.collateral.toFixed(2)} ${vault.collateralTokenSymbol}`,
                  sub: `$${vault.collateralUSD.toLocaleString()}`,
                },
                {
                  label: "Outstanding Debt",
                  val: `${vault.debtVUSD.toLocaleString()} vUSD`,
                  sub: null,
                },
                {
                  label: "Collateral Ratio",
                  val: `${vault.collateralRatio.toFixed(1)}%`,
                  sub: "Min 110%",
                  color: urgencyColor,
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-[10px] border border-white/6 bg-white/[0.03] px-3 py-2.5"
                >
                  <div className="mb-1 font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                    {s.label}
                  </div>
                  <div
                    className="font-mono text-[13px] font-medium"
                    style={{ color: s.color ?? "#e4e4e7" }}
                  >
                    {s.val}
                  </div>
                  {s.sub && (
                    <div className="mt-0.5 font-mono text-[9px] text-zinc-500">
                      {s.sub}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Percentage / amount */}
            <div className="mb-4">
              <div className="mb-2 flex justify-between">
                <span className="text-xs font-medium text-zinc-500">
                  vUSD to burn
                </span>
                <span className="font-mono text-[11px] text-zinc-500">
                  Max redeemable:{" "}
                  <span className="text-zinc-400">
                    {maxRedeemable.toLocaleString()} vUSD
                  </span>
                </span>
              </div>
              <div className="relative">
                <div className="flex items-center gap-2 rounded-[11px] border border-white/[0.09] bg-white/[0.04] px-4 py-3.5">
                  <span className="font-mono text-base text-zinc-100">
                    {parseFloat(payAmountHuman) > 0
                      ? parseFloat(payAmountHuman).toLocaleString()
                      : "0"}
                  </span>
                  <div className="flex items-center gap-1.5 rounded-md border border-white/8 bg-white/[0.06] px-2.5 py-1">
                    <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-700 text-[7px] font-bold text-white">
                      v
                    </div>
                    <span className="font-mono text-[11px] text-zinc-400">
                      vUSD
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-2 flex gap-1">
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setPercentage(pct)}
                    className="rounded-md border border-white/[0.07] bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-zinc-500 transition-colors hover:border-amber-500/35 hover:text-amber-500"
                  >
                    {pct === 100 ? "MAX" : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Trade summary */}
            {isValid && (
              <div className="mb-4 rounded-xl border border-amber-500/15 bg-amber-500/5 p-4">
                <div className="mb-3 font-mono text-[9px] uppercase tracking-widest text-amber-700">
                  Trade Summary
                </div>
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-center">
                    <div className="mb-1 font-mono text-[9px] uppercase tracking-widest text-zinc-500">
                      You Burn
                    </div>
                    <div className="font-mono text-xl font-medium text-zinc-100">
                      {parseFloat(payAmountHuman).toLocaleString()}
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-zinc-500">
                      vUSD
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="text-lg text-amber-500">→</div>
                    <div className="font-mono text-[9px] text-zinc-500">
                      at MCR
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="mb-1 font-mono text-[9px] uppercase tracking-widest text-zinc-500">
                      You Receive
                    </div>
                    <div className="font-mono text-xl font-medium text-amber-500">
                      {parseFloat(collateralOutHuman).toFixed(4)}
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-zinc-500">
                      {vault.collateralTokenSymbol} ($
                      {collateralOutUSD.toFixed(2)})
                    </div>
                  </div>
                </div>
                <div className="mb-2 h-px bg-white/[0.06]" />
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-500">Rate</span>
                    <span className="font-mono text-zinc-400">
                      1 vUSD = $1 of {vault.collateralTokenSymbol} at MCR
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-500">
                      {vault.collateralTokenSymbol} Price
                    </span>
                    <span className="font-mono text-zinc-400">
                      ${wethPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* External redemption warning */}
            {!vault.isOwn && (
              <div className="mb-4 flex gap-2.5 rounded-[10px] border border-white/[0.07] bg-white/[0.03] p-3">
                <span className="text-[13px]">ℹ</span>
                <p className="text-[11px] leading-relaxed text-zinc-500">
                  You are redeeming against another user&apos;s vault. Their debt
                  and collateral will be reduced proportionally. The vault owner
                  is not penalised — this is a protocol mechanism to maintain
                  peg stability.
                </p>
              </div>
            )}

            {/* CTAs */}
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-[10px] border border-white/8 bg-white/[0.04] px-4 py-3 text-[13px] font-semibold text-zinc-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValid}
                className={`flex-[2] rounded-[10px] px-4 py-3 text-[13px] font-semibold transition-all ${
                  isValid
                    ? "bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-[0_0_22px_rgba(234,179,8,0.2)] hover:opacity-90"
                    : "cursor-default border border-white/[0.07] bg-white/[0.04] text-zinc-500"
                }`}
              >
                {isValid
                  ? `Redeem ${parseFloat(collateralOutHuman).toFixed(4)} ${vault.collateralTokenSymbol}`
                  : "Enter an amount"}
              </button>
            </div>
          </form>
        </TransactionWrapper>
      </div>
    </div>
  )
}
