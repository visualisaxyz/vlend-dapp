"use client"

import { useEffect, useRef, useState } from "react"
import { erc20Abi, formatEther, formatUnits, parseEther, parseUnits } from "viem"
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi"

import { MAX_ALLOWANCE, nativeWrappedTokens } from "@/config/blockchain"
import useAbi from "@/hooks/use-abi"
import useCollateralBalance from "@/hooks/use-collateral-balance"
import useCollaterals from "@/hooks/use-collaterals"
import useInternalChainId from "@/hooks/use-internal-chain-id"
import useTokenApproval from "@/hooks/use-token-approval"
import useVault from "@/hooks/use-vault"
import useVaultRealTime from "@/hooks/use-vault-real-time"
import HFGauge from "@/components/ui/hf-gauge"
import ScrollableCollaterals from "@/components/ui/scrollable-collaterals"
import Tag from "@/components/ui/tag"
import TransactionDialog from "@/components/ui/interactions/transaction-dialog"
import TokenIcon from "@/components/ui/token-icon"

function hfColor(hf: number): string {
  if (!isFinite(hf)) return "#22c55e"
  if (hf < 1.1) return "#ef4444"
  if (hf < 1.3) return "#f97316"
  if (hf < 1.5) return "#eab308"
  return "#22c55e"
}

function hfLabel(hf: number): string {
  if (!isFinite(hf)) return "Safe"
  if (hf < 1.1) return "Critical"
  if (hf < 1.3) return "High Risk"
  if (hf < 1.5) return "At Risk"
  return "Safe"
}

type ManageVaultPanelProps = {
  vaultAddress: string
  onBack: () => void
  /** When true, hides the Back + Vault # header (for use on standalone vault page) */
  compact?: boolean
}

const MCR = 1.1

function calcHF(collateralUSD: number, debt: number): number {
  if (debt === 0) return Infinity
  return collateralUSD / (debt * MCR)
}

export default function ManageVaultPanel({ vaultAddress, onBack, compact = false }: ManageVaultPanelProps) {
  const vaultFactoryAbi = useAbi("VaultFactory")
  const mintableTokenAbi = useAbi("MintableToken")
  const chainId = useInternalChainId()
  const { address } = useAccount()

  const { vault, isLoading: vaultLoading } = useVault(vaultAddress, 5000)
  const { debt, borrowable } = useVaultRealTime(vaultAddress as `0x${string}`)
  const { collaterals } = useCollaterals()
  const [collateral, setCollateral] = useState<`0x${string}` | undefined>(undefined)

  const { balance: collateralBalance, decimals, symbol } = useCollateralBalance(collateral)
  const { balance: vusdBalance } = useCollateralBalance(mintableTokenAbi?.address)

  const { data: hash, writeContract, isPending } = useWriteContract()
  const { isSuccess: txSuccess } = useWaitForTransactionReceipt({ hash, chainId })
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined)
  const [done, setDone] = useState(false)
  const [tab, setTab] = useState<"deposit" | "withdraw" | "borrow" | "repay">("deposit")
  const [amount, setAmount] = useState("")
  const lastActionRef = useRef<"approve" | "action" | null>(null)

  const num = parseFloat(amount) || 0

  useEffect(() => {
    setCollateral(vault?.collaterals?.[0] as `0x${string}` | undefined)
  }, [vault?.collaterals])

  useEffect(() => {
    setTxHash(hash ?? undefined)
  }, [hash])

  useEffect(() => {
    if (txSuccess && lastActionRef.current === "action") {
      setDone(true)
      lastActionRef.current = null
    }
  }, [txSuccess])

  useEffect(() => {
    if (
      txSuccess &&
      lastActionRef.current === "approve" &&
      vaultFactoryAbi?.abi &&
      vaultFactoryAbi?.address
    ) {
      lastActionRef.current = "action"
      if (tab === "repay") {
        writeContract({
          abi: vaultFactoryAbi.abi,
          address: vaultFactoryAbi.address,
          chainId,
          functionName: "repay",
          args: [vaultAddress as `0x${string}`, parseEther(amount)],
          gas: BigInt(5_000_000),
        })
      } else if (tab === "deposit" && collateral) {
        writeContract({
          abi: vaultFactoryAbi.abi,
          address: vaultFactoryAbi.address,
          chainId,
          functionName: "addCollateral",
          args: [vaultAddress as `0x${string}`, collateral, parseUnits(amount, decimals ?? 18)],
          gas: BigInt(5_000_000),
        })
      }
    }
  }, [
    txSuccess,
    tab,
    vaultFactoryAbi?.abi,
    vaultFactoryAbi?.address,
    vaultAddress,
    amount,
    chainId,
    writeContract,
    collateral,
    decimals,
  ])

  const collateralInfo = vault?.collateralInfo?.find(
    (c) => c.address.toLowerCase() === collateral?.toLowerCase()
  )
  const maxWithdrawable = parseFloat(collateralInfo?.maxWithdrawable ?? "0") || 0
  const collateralUSD = parseFloat(vault?.tvl ?? "0") || 0
  const debtNum = debt ? Number(formatEther(debt)) : 0
  const borrowableNum = borrowable?.[1] ? Number(formatEther(borrowable[1] as bigint)) : 0
  const maxBorrowMore = Math.max(0, (collateralUSD / MCR) - debtNum)

  const foundCollateral = collaterals?.find((c) => c.address.toLowerCase() === collateral?.toLowerCase())
  const price = parseFloat(foundCollateral?.price ?? "0") || 0

  function simulate() {
    if (tab === "deposit") {
      const newCollUSD = collateralUSD + num * price
      return { collUSD: newCollUSD, debt: debtNum, hf: calcHF(newCollUSD, debtNum) }
    }
    if (tab === "withdraw") {
      const newCollUSD = collateralUSD - num * price
      return { collUSD: newCollUSD, debt: debtNum, hf: calcHF(newCollUSD, debtNum) }
    }
    if (tab === "borrow") {
      return { collUSD: collateralUSD, debt: debtNum + num, hf: calcHF(collateralUSD, debtNum + num) }
    }
    return { collUSD: collateralUSD, debt: debtNum - num, hf: calcHF(collateralUSD, debtNum - num) }
  }

  const sim = num > 0 ? simulate() : null
  const currentHF = debtNum > 0 ? calcHF(collateralUSD, debtNum) : Infinity
  const simHF = sim ? sim.hf : currentHF
  const simColor = hfColor(simHF)
  const delta = sim ? simHF - currentHF : 0
  const improving = delta >= 0

  const tabConfig = {
    deposit: {
      label: "Deposit",
      unit: symbol ?? "WETH",
      placeholder: "0.00",
      max: `${formatUnits(collateralBalance ?? BigInt(0), decimals ?? 18)} ${symbol ?? ""} available`,
      color: "#22c55e",
    },
    withdraw: {
      label: "Withdraw",
      unit: symbol ?? "WETH",
      placeholder: "0.00",
      max: `${maxWithdrawable.toFixed(2)} ${symbol ?? ""} max`,
      color: "#3b82f6",
    },
    borrow: {
      label: "Borrow",
      unit: "vUSD",
      placeholder: "0.00",
      max: `${maxBorrowMore.toFixed(2)} vUSD available`,
      color: "#22c55e",
    },
    repay: {
      label: "Repay",
      unit: "vUSD",
      placeholder: "0.00",
      max: `${debtNum.toLocaleString()} vUSD owed`,
      color: "#ef4444",
    },
  }
  const cfg = tabConfig[tab]

  const { isApproved } = useTokenApproval(
    tab === "repay" ? mintableTokenAbi?.address : collateral,
    vaultFactoryAbi.address,
    parseUnits(amount || "0", 18)
  )

  function handleConfirm() {
    if (!vaultFactoryAbi?.abi || !vaultFactoryAbi?.address || !address) return

    if (tab === "deposit") {
      lastActionRef.current = "action"
      const isNative =
        collateral?.toLowerCase() ===
        nativeWrappedTokens[chainId as keyof typeof nativeWrappedTokens]?.toLowerCase()
      if (isNative) {
        writeContract({
          abi: [
            {
              inputs: [{ internalType: "address", name: "_vault", type: "address" }],
              name: "addCollateralNative",
              outputs: [],
              stateMutability: "payable",
              type: "function",
            },
          ],
          address: vaultFactoryAbi.address,
          chainId,
          functionName: "addCollateralNative",
          args: [vaultAddress as `0x${string}`],
          value: parseUnits(amount, decimals ?? 18),
          gas: BigInt(5_000_000),
        })
      } else if (isApproved) {
        writeContract({
          abi: vaultFactoryAbi.abi,
          address: vaultFactoryAbi.address,
          chainId,
          functionName: "addCollateral",
          args: [vaultAddress as `0x${string}`, collateral!, parseUnits(amount, decimals ?? 18)],
          gas: BigInt(5_000_000),
        })
      } else {
        lastActionRef.current = "approve"
        writeContract({
          abi: erc20Abi,
          address: collateral!,
          chainId,
          functionName: "approve",
          args: [vaultFactoryAbi.address, MAX_ALLOWANCE],
        })
      }
      return
    }

    if (tab === "withdraw") {
      lastActionRef.current = "action"
      const isNative =
        collateral?.toLowerCase() ===
        nativeWrappedTokens[chainId as keyof typeof nativeWrappedTokens]?.toLowerCase()
      if (isNative) {
        writeContract({
          abi: vaultFactoryAbi.abi,
          address: vaultFactoryAbi.address,
          chainId,
          functionName: "removeCollateralNative",
          args: [vaultAddress as `0x${string}`, parseUnits(amount, decimals ?? 18), address],
          gas: BigInt(5_000_000),
        })
      } else {
        writeContract({
          abi: vaultFactoryAbi.abi,
          address: vaultFactoryAbi.address,
          chainId,
          functionName: "removeCollateral",
          args: [vaultAddress as `0x${string}`, collateral!, parseUnits(amount, decimals ?? 18), address],
          gas: BigInt(5_000_000),
        })
      }
      return
    }

    if (tab === "borrow") {
      lastActionRef.current = "action"
      writeContract({
        abi: vaultFactoryAbi.abi,
        address: vaultFactoryAbi.address,
        chainId,
        functionName: "borrow",
        args: [vaultAddress as `0x${string}`, parseEther(amount), address],
        gas: BigInt(5_000_000),
      })
      return
    }

    if (tab === "repay") {
      if (!isApproved) {
        lastActionRef.current = "approve"
        writeContract({
          abi: erc20Abi,
          address: mintableTokenAbi!.address!,
          chainId,
          functionName: "approve",
          args: [vaultFactoryAbi.address, MAX_ALLOWANCE],
        })
      } else {
        lastActionRef.current = "action"
        writeContract({
          abi: vaultFactoryAbi.abi,
          address: vaultFactoryAbi.address,
          chainId,
          functionName: "repay",
          args: [vaultAddress as `0x${string}`, parseEther(amount)],
          gas: BigInt(5_000_000),
        })
      }
    }
  }


  if (vaultLoading || !vault) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const collateralAmount = vault.collateralInfo?.[0]?.amount ?? "0"
  const collateralRatio = debtNum > 0 ? (collateralUSD / debtNum) * 100 : Infinity

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
        <div
          className="flex h-[60px] w-[60px] items-center justify-center rounded-full text-[28px]"
          style={{
            background: "rgba(34,197,94,0.12)",
            border: "1px solid rgba(34,197,94,0.3)",
          }}
        >
          ✓
        </div>
        <div className="text-lg font-semibold text-zinc-100">Transaction Submitted</div>
        <div className="text-[13px] text-zinc-500">Vault #{vaultAddress.slice(0, 6)}...{vaultAddress.slice(-4)} has been updated.</div>
        <button
          type="button"
          onClick={onBack}
          className="mt-2 rounded-[10px] border px-7 py-2.5 text-[13px] font-semibold text-zinc-400"
          style={{
            background: "rgba(255,255,255,0.06)",
            borderColor: "rgba(255,255,255,0.1)",
          }}
        >
          Back to Vaults
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {!compact && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 border-none bg-transparent p-0 text-xs text-zinc-500 cursor-pointer hover:text-zinc-400"
          >
            ← Back
          </button>
          <span className="font-mono text-[13px] font-semibold text-zinc-200">
            Vault #{vaultAddress.slice(0, 6)}...{vaultAddress.slice(-4)}
          </span>
          <Tag color={hfColor(currentHF)} small>
            {hfLabel(currentHF)}
          </Tag>
        </div>
      )}

      {/* Current state */}
      <div
        className="rounded-[14px] border p-4"
        style={{
          background: "rgba(255,255,255,0.025)",
          borderColor: "rgba(255,255,255,0.07)",
        }}
      >
        <div className="mb-3.5 font-mono text-[9px] uppercase tracking-wider text-zinc-500">
          Current State
        </div>
        <div className="flex items-center gap-4">
          <HFGauge hf={currentHF} size={90} />
          <div className="flex flex-1 flex-col gap-2">
            {[
              ["Collateral", `${collateralAmount} ${vault.collateralInfo?.[0]?.symbol ?? ""} ($${collateralUSD.toLocaleString()})`],
              ["Debt", `${debtNum.toLocaleString()} vUSD`],
              ["Collateral Ratio", `${isFinite(collateralRatio) ? collateralRatio.toFixed(1) : "∞"}%`],
            ].map(([l, v]) => (
              <div key={String(l)} className="flex justify-between">
                <span className="text-xs text-zinc-500">{l}</span>
                <span className="font-mono text-xs text-zinc-400">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action tabs */}
      <div
        className="grid grid-cols-4 gap-1 rounded-[10px] border p-1"
        style={{
          background: "rgba(255,255,255,0.04)",
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        {(["deposit", "withdraw", "borrow", "repay"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => {
              setTab(v)
              setAmount("")
            }}
            className="rounded-md py-2 text-xs font-semibold transition-colors"
            style={{
              color: tab === v ? "#f4f4f5" : "#52525b",
              background: tab === v ? "rgba(255,255,255,0.08)" : "transparent",
            }}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {(tab === "deposit" || tab === "withdraw") && (
        <div>
          <div className="mb-2 text-xs font-medium text-zinc-500">Collateral</div>
          <ScrollableCollaterals
            collaterals={collaterals}
            placeholder="Select collateral"
            className="w-full"
            value={collateral ?? ""}
            onValueChange={(v) => setCollateral(v as `0x${string}`)}
          />
        </div>
      )}

      {/* Input */}
      <div>
        <div className="mb-2 flex justify-between text-xs font-medium text-zinc-500">
          <span>{cfg.label}</span>
          <span className="font-mono text-[11px]">{cfg.max}</span>
        </div>
        <div className="relative">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={cfg.placeholder}
            className="w-full rounded-[11px] border bg-white/[0.04] px-4 py-3 pr-[100px] font-mono text-base text-zinc-100 outline-none transition-[border-color] placeholder:text-zinc-600"
            style={{
              borderColor: "rgba(255,255,255,0.09)",
              caretColor: cfg.color,
            }}
          />
          <div className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (tab === "deposit") setAmount(formatUnits(collateralBalance ?? BigInt(0), decimals ?? 18))
                else if (tab === "withdraw") setAmount(maxWithdrawable.toFixed(2))
                else if (tab === "borrow") setAmount(maxBorrowMore.toFixed(2))
                else setAmount(debtNum.toFixed(2))
              }}
              className="rounded-md border px-2 py-1 font-mono text-[10px]"
              style={{
                color: cfg.color,
                background: `${cfg.color}18`,
                borderColor: `${cfg.color}30`,
              }}
            >
              MAX
            </button>
            <div className="flex items-center gap-1 rounded-md border px-2 py-1" style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.08)" }}>
              {cfg.unit === "vUSD" ? (
                <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-[7px] font-bold text-white" style={{ background: "linear-gradient(135deg,#22c55e,#15803d)" }}>v</div>
              ) : (
                <TokenIcon symbol={foundCollateral?.tokenName ?? "WETH"} width={14} height={14} />
              )}
              <span className="font-mono text-[11px] text-zinc-400">{cfg.unit}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Simulation preview */}
      {sim && (
        <div
          className="rounded-xl border p-4"
          style={{
            background: "rgba(255,255,255,0.02)",
            borderColor: `${simColor}22`,
          }}
        >
          <div className="mb-3 font-mono text-[9px] uppercase tracking-wider text-zinc-500">
            After Transaction
          </div>
          <div className="flex items-center gap-4">
            <HFGauge hf={simHF} size={80} />
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-xs text-zinc-500">Health Factor</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] text-zinc-500">{currentHF.toFixed(2)}</span>
                  <span className={`font-mono text-[11px] ${improving ? "text-green-500" : "text-red-500"}`}>
                    {improving ? "↑" : "↓"} {Math.abs(delta).toFixed(2)}
                  </span>
                  <span className="font-mono text-xs font-semibold" style={{ color: simColor }}>
                    → {isFinite(simHF) ? simHF.toFixed(2) : "∞"}
                  </span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-zinc-500">New CR</span>
                <span className="font-mono text-xs text-zinc-400">
                  {sim.debt > 0 ? ((sim.collUSD / sim.debt) * 100).toFixed(1) : "∞"}%
                </span>
              </div>
            </div>
          </div>
          {simHF < 1.5 && isFinite(simHF) && (
            <div
              className="mt-2.5 rounded-lg border p-3 text-[11px] leading-relaxed"
              style={{
                background: simHF < 1.1 ? "rgba(239,68,68,0.08)" : "rgba(234,179,8,0.06)",
                borderColor: simHF < 1.1 ? "rgba(239,68,68,0.2)" : "rgba(234,179,8,0.18)",
                color: simHF < 1.1 ? "#fca5a5" : "#a16207",
              }}
            >
              {simHF < 1.1
                ? "⚠ Health factor would drop below 1.1 — very close to liquidation."
                : "⚠ Below safe ratio after this transaction. Consider a smaller amount."}
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => num > 0 && handleConfirm()}
        disabled={num <= 0 || isPending}
        className="rounded-[11px] py-3 text-[13px] font-semibold transition-all disabled:cursor-not-allowed"
        style={{
          background: num > 0 ? `linear-gradient(135deg,${cfg.color},${cfg.color}bb)` : "rgba(255,255,255,0.05)",
          color: num > 0 ? "#fff" : "#52525b",
          border: num > 0 ? "none" : "1px solid rgba(255,255,255,0.07)",
          cursor: num > 0 ? "pointer" : "not-allowed",
          boxShadow: num > 0 ? `0 0 22px ${cfg.color}22` : "none",
        }}
      >
        {isPending ? "Confirming..." : num > 0 ? `Confirm ${cfg.label}` : `Enter amount to ${tab}`}
      </button>

      {txHash && (
        <TransactionDialog open hash={txHash} onOpenChange={() => setTxHash(undefined)} />
      )}
    </div>
  )
}
