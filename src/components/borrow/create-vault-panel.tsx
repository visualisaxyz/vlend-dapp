"use client"

import { useEffect, useRef, useState } from "react"
import {
  BaseError,
  ContractFunctionRevertedError,
  decodeErrorResult,
  encodeFunctionData,
  erc20Abi,
  formatEther,
  formatUnits,
  parseEther,
  parseUnits,
} from "viem"
import {
  useAccount,
  useSendTransaction,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi"

import {
  ADDRESS_ZERO,
  MAX_ALLOWANCE,
  nativeWrappedTokens,
} from "@/config/blockchain"

const CREATE_VAULT_GAS = BigInt(125_000_000)

// Common errors for decoding reverts (Zapper calls WETH/ERC20 which may revert)
const COMMON_ERROR_ABI = [
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "allowance", type: "uint256" },
      { name: "needed", type: "uint256" },
    ],
    name: "ERC20InsufficientAllowance",
    type: "error",
  },
  {
    inputs: [
      { name: "account", type: "address" },
      { name: "balance", type: "uint256" },
      { name: "needed", type: "uint256" },
    ],
    name: "ERC20InsufficientBalance",
    type: "error",
  },
  { inputs: [{ name: "reason", type: "uint256" }], name: "Panic", type: "error" },
  { inputs: [{ name: "message", type: "string" }], name: "Error", type: "error" },
] as const
import useAbi from "@/hooks/use-abi"
import useBorrowInfo from "@/hooks/use-borrow-info"
import useCollateralBalance from "@/hooks/use-collateral-balance"
import useCollaterals from "@/hooks/use-collaterals"
import useInternalChainId from "@/hooks/use-internal-chain-id"
import useTokenApproval from "@/hooks/use-token-approval"
import HFGauge from "@/components/ui/hf-gauge"
import TransactionDialog from "@/components/ui/interactions/transaction-dialog"
import ScrollableCollaterals from "@/components/ui/scrollable-collaterals"
import TokenIcon from "@/components/ui/token-icon"

function hfColor(hf: number): string {
  if (!isFinite(hf)) return "#22c55e"
  if (hf < 1.1) return "#ef4444"
  if (hf < 1.3) return "#f97316"
  if (hf < 1.5) return "#eab308"
  return "#22c55e"
}

function getRevertReason(err: unknown): string {
  if (!(err instanceof Error)) return String(err)
  const baseErr = err as BaseError

  // Try ContractFunctionRevertedError first (viem's decoded wrapper)
  const revertErr = baseErr.walk(
    (e) => e instanceof ContractFunctionRevertedError
  )
  if (revertErr instanceof ContractFunctionRevertedError) {
    const { errorName, args } = revertErr.data ?? {}
    if (errorName) {
      const argsStr = Array.isArray(args) && args.length
        ? ` (${args.map(String).join(", ")})`
        : ""
      return `${errorName}${argsStr}`
    }
    if (revertErr.reason) return revertErr.reason
    if (revertErr.signature)
      return `Unknown error (${revertErr.signature}). Look up: https://openchain.xyz/signatures?query=${revertErr.signature}`
  }

  // Try to find raw revert data in the error chain (RPC may not pass it to viem's decoder)
  function findRawData(e: unknown): `0x${string}` | undefined {
    if (!e || typeof e !== "object") return undefined
    const obj = e as Record<string, unknown>
    if ("data" in obj) {
      const d = obj.data
      if (typeof d === "string" && d.startsWith("0x")) return d as `0x${string}`
      if (d && typeof d === "object" && "data" in (d as object))
        return findRawData((d as { data: unknown }).data)
    }
    if ("cause" in obj) return findRawData(obj.cause)
    return undefined
  }
  const rawData = findRawData(err)
  if (rawData && rawData !== "0x" && rawData.length > 10) {
    try {
      const decoded = decodeErrorResult({
        abi: [...COMMON_ERROR_ABI],
        data: rawData,
      })
      const { errorName, args } = decoded
      const argsStr = Array.isArray(args) && args.length
        ? ` (${args.map(String).join(", ")})`
        : ""
      return `${errorName}${argsStr}`
    } catch {
      const sig = rawData.slice(0, 10)
      return `Unknown error (${sig}). Look up: https://openchain.xyz/signatures?query=${sig}`
    }
  }

  return revertErr instanceof ContractFunctionRevertedError
    ? revertErr.message
    : err.message
}

type CreateVaultPanelProps = {
  onSuccess: () => void
}

export default function CreateVaultPanel({ onSuccess }: CreateVaultPanelProps) {
  const vaultFactoryZapperAbi = useAbi("VaultFactoryZapper")
  const chainId = useInternalChainId()
  const { address } = useAccount()

  const {
    data: hash,
    writeContract,
    isPending: isWritePending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract()
  const {
    sendTransactionAsync,
    isPending: isSendPending,
    error: sendError,
    reset: resetSend,
  } = useSendTransaction()
  const [sendTxHash, setSendTxHash] = useState<`0x${string}` | undefined>(undefined)
  const effectiveHash = hash ?? sendTxHash
  const { isSuccess: txSuccess } = useWaitForTransactionReceipt({
    hash: effectiveHash,
    chainId,
  })
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined)
  const isPending = isWritePending || isSendPending
  const [simulateError, setSimulateError] = useState<string | null>(null)
  const [awaitingCreateAfterApprove, setAwaitingCreateAfterApprove] = useState(false)
  const lastActionRef = useRef<"approve" | "create" | null>(null)

  const [step, setStep] = useState(1)
  const [collateralInput, setCollateralInput] = useState("")
  const [borrowInput, setBorrowInput] = useState("")
  const [borrowSliderPct, setBorrowSliderPct] = useState(0)
  const [isBorrowSliderActive, setIsBorrowSliderActive] = useState(false)
  const [depositWithNative, setDepositWithNative] = useState(false)

  const { collaterals } = useCollaterals()
  const [collateral, setCollateral] = useState<`0x${string}` | undefined>(
    undefined
  )

  const isWeth =
    collateral?.toLowerCase() ===
    nativeWrappedTokens[
      chainId as keyof typeof nativeWrappedTokens
    ]?.toLowerCase()
  const useNative = isWeth && depositWithNative
  const { balance, decimals, symbol } = useCollateralBalance(
    collateral,
    "0x",
    useNative
  )
  const { isApproved, refetch: refetchAllowance } = useTokenApproval(
    collateral,
    vaultFactoryZapperAbi?.address,
    parseUnits(collateralInput ?? "0", decimals ?? 18)
  )

  const {
    maxBorrowHuman,
    maxBorrow,
    healthFactorHuman,
    feeHuman,
    netReceivedHuman,
    feePercentageHuman,
  } = useBorrowInfo(collateral, collaterals, collateralInput, borrowInput)

  const collateralNum = parseFloat(collateralInput) || 0
  const borrowNum = parseFloat(borrowInput) || 0
  const maxBorrowNum = parseFloat(maxBorrowHuman) || 0
  const feeNum = parseFloat(feeHuman) || 0
  const borrowReceivedNum = parseFloat(netReceivedHuman) || 0
  const hf = parseFloat(healthFactorHuman) || 0
  const collateralUSD = collaterals?.find(
    (c) => c.address.toLowerCase() === collateral?.toLowerCase()
  )
    ? collateralNum *
      parseFloat(
        collaterals.find(
          (c) => c.address.toLowerCase() === collateral?.toLowerCase()
        )?.price ?? "0"
      )
    : 0
  const crPct = borrowNum > 0 ? (collateralUSD / borrowNum) * 100 : Infinity
  const color = hfColor(hf)

  const isCollateralValid =
    !!collateral &&
    collateral !== ADDRESS_ZERO &&
    collateral !== "0x" &&
    collateral.length === 42
  const isValid =
    isCollateralValid &&
    collateralNum > 0 &&
    borrowNum > 0 &&
    borrowNum <= maxBorrowNum * 0.999
  const sliderPct =
    maxBorrowNum > 0 ? Math.min((borrowNum / maxBorrowNum) * 100, 100) : 0
  const riskZone =
    sliderPct > 90
      ? "danger"
      : sliderPct > 70
        ? "warning"
        : sliderPct > 50
          ? "caution"
          : "safe"
  const riskColor = {
    danger: "#ef4444",
    warning: "#f97316",
    caution: "#eab308",
    safe: "#22c55e",
  }[riskZone]

  useEffect(() => {
    setTxHash(effectiveHash ?? undefined)
  }, [effectiveHash])

  useEffect(() => {
    if (txSuccess && lastActionRef.current === "create") {
      setStep(3)
      lastActionRef.current = null
      setAwaitingCreateAfterApprove(false)
    }
  }, [txSuccess])

  useEffect(() => {
    if (collateral) {
      setCollateralInput("")
      setBorrowInput("")
      setBorrowSliderPct(0)
      setIsBorrowSliderActive(false)
      setAwaitingCreateAfterApprove(false)
      setSimulateError(null)
      if (
        collateral.toLowerCase() !==
        nativeWrappedTokens[
          chainId as keyof typeof nativeWrappedTokens
        ]?.toLowerCase()
      ) {
        setDepositWithNative(false)
      }
    }
  }, [collateral, chainId])

  useEffect(() => {
    if (maxBorrowNum > 0 && isBorrowSliderActive) {
      setBorrowInput((maxBorrowNum * (borrowSliderPct / 100)).toFixed(2))
    }
  }, [borrowSliderPct, isBorrowSliderActive, maxBorrowNum])

  useEffect(() => {
    if (maxBorrowNum > 0 && !isBorrowSliderActive && borrowNum > 0) {
      setBorrowSliderPct(Math.min((borrowNum / maxBorrowNum) * 100, 99))
    }
  }, [borrowNum, maxBorrowNum, isBorrowSliderActive])

  async function doCreateVault() {
    if (
      !isCollateralValid ||
      !address ||
      !vaultFactoryZapperAbi?.abi ||
      !vaultFactoryZapperAbi?.address
    ) {
      if (!isCollateralValid) {
        setSimulateError("Invalid collateral: please select a collateral token.")
      }
      return
    }
    const realBorrowAmount = borrowInput || "0"
    const collateralAmountWei = parseUnits(collateralInput ?? "0", decimals ?? 18)
    const requestedBorrow = parseEther(realBorrowAmount)
    const borrowAmountWei =
      maxBorrow > BigInt(0)
        ? requestedBorrow > (maxBorrow * BigInt(90)) / BigInt(100)
          ? (maxBorrow * BigInt(90)) / BigInt(100)
          : requestedBorrow
        : requestedBorrow

    setSimulateError(null)

    lastActionRef.current = "create"
    setSendTxHash(undefined)
    const collateralAddr = collateral as `0x${string}`
    if (
      !collateralAddr ||
      collateralAddr === ADDRESS_ZERO ||
      collateralAddr.length !== 42
    ) {
      setSimulateError("Invalid collateral address. Please try again.")
      return
    }
    try {
      const data = encodeFunctionData({
        abi: vaultFactoryZapperAbi.abi,
        functionName: "createVault",
        args: [collateralAddr, collateralAmountWei, borrowAmountWei],
      })
      const txHash = await sendTransactionAsync({
        to: vaultFactoryZapperAbi.address,
        data,
        gas: CREATE_VAULT_GAS,
        chainId,
      })
      setSendTxHash(txHash)
    } catch (err) {
      const msg = err instanceof Error ? err.message : getRevertReason(err)
      setSimulateError(msg)
    }
  }

  async function handleConfirm() {
    resetWrite()
    resetSend()
    setSimulateError(null)
    setSendTxHash(undefined)
    if (!isCollateralValid || !address) {
      if (!isCollateralValid) {
        setSimulateError("Invalid collateral: please select a collateral token.")
      }
      return
    }
    const realBorrowAmount = borrowInput || "0"

    const isWeth =
      collateral.toLowerCase() ===
      nativeWrappedTokens[
        chainId as keyof typeof nativeWrappedTokens
      ]?.toLowerCase()

    // Native ETH: createVaultNative (zapper)
    if (isWeth && depositWithNative) {
      if (!vaultFactoryZapperAbi?.address) return
      lastActionRef.current = "create"
      writeContract({
        abi: [
          {
            inputs: [
              {
                internalType: "uint256",
                name: "_borrowAmount",
                type: "uint256",
              },
            ],
            name: "createVaultNative",
            outputs: [
              { internalType: "address", name: "_vault", type: "address" },
            ],
            stateMutability: "payable",
            type: "function",
          },
        ],
        address: vaultFactoryZapperAbi.address,
        chainId,
        functionName: "createVaultNative",
        args: [parseEther(realBorrowAmount)],
        value: parseEther(collateralInput),
        gas: CREATE_VAULT_GAS,
      })
      return
    }

    // WETH (ERC20) or other collateral: approve Zapper first, then createVault
    if (!vaultFactoryZapperAbi?.abi || !vaultFactoryZapperAbi?.address) return
    if (!isApproved) {
      lastActionRef.current = "approve"
      writeContract({
        abi: erc20Abi,
        address: collateral,
        chainId,
        functionName: "approve",
        args: [vaultFactoryZapperAbi.address, MAX_ALLOWANCE],
      })
      return
    }

    await doCreateVault()
  }

  useEffect(() => {
    if (
      txSuccess &&
      lastActionRef.current === "approve" &&
      isCollateralValid &&
      vaultFactoryZapperAbi?.abi &&
      vaultFactoryZapperAbi?.address &&
      address &&
      !awaitingCreateAfterApprove
    ) {
      setAwaitingCreateAfterApprove(true)
      refetchAllowance().then(() => {
        doCreateVault()
      })
    }
  }, [
    txSuccess,
    isCollateralValid,
    vaultFactoryZapperAbi?.abi,
    vaultFactoryZapperAbi?.address,
    address,
    awaitingCreateAfterApprove,
    refetchAllowance,
  ])

  if (step === 3) {
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
        <div className="text-lg font-semibold text-zinc-100">
          Vault Created!
        </div>
        <div className="max-w-[280px] text-[13px] text-zinc-500">
          Your new vault is live. You received {borrowReceivedNum.toFixed(2)}{" "}
          vUSD after the {feePercentageHuman}% borrow fee.
        </div>
        <button
          type="button"
          onClick={onSuccess}
          className="mt-2 rounded-[10px] px-7 py-2.5 text-[13px] font-semibold text-white"
          style={{
            background: "linear-gradient(135deg,#22c55e,#15803d)",
          }}
        >
          View My Vaults
        </button>
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="py-2">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="mb-5 flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 text-xs text-zinc-500"
        >
          ← Back
        </button>
        <div className="mb-4 text-[15px] font-semibold text-zinc-100">
          Confirm New Vault
        </div>

        <div
          className="mb-4 rounded-[14px] border p-[18px]"
          style={{
            background: "rgba(255,255,255,0.03)",
            borderColor: "rgba(255,255,255,0.07)",
          }}
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="text-center">
              <div className="mb-1.5 font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                You Deposit
              </div>
              <div className="font-mono text-[22px] font-semibold text-zinc-100">
                {collateralNum}
              </div>
              <div className="mt-1 font-mono text-[11px] text-zinc-500">
                {symbol} (${collateralUSD.toLocaleString()})
              </div>
            </div>
            <div className="text-xl text-primary">→</div>
            <div className="text-center">
              <div className="mb-1.5 font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                You Receive
              </div>
              <div className="font-mono text-[22px] font-semibold text-primary">
                {borrowReceivedNum.toFixed(2)}
              </div>
              <div className="mt-1 font-mono text-[11px] text-zinc-500">
                vUSD
              </div>
            </div>
          </div>
          <div className="mb-3 h-px bg-white/[0.06]" />
          {[
            ["Borrow requested", `${borrowNum.toFixed(2)} vUSD`],
            [
              `Borrow fee (${feePercentageHuman}%)`,
              `-${feeNum.toFixed(2)} vUSD`,
            ],
            ["vUSD received", `${borrowReceivedNum.toFixed(2)} vUSD`],
            ["Health Factor", hf.toFixed(2)],
            [
              "Collateral Ratio",
              `${isFinite(crPct) ? crPct.toFixed(1) : "∞"}%`,
            ],
          ].map(([l, v], i) => (
            <div key={String(l)} className="mb-2 flex justify-between">
              <span className="text-xs text-zinc-500">{l}</span>
              <span
                className="font-mono text-xs"
                style={{ color: i === 3 ? color : "#a1a1aa" }}
              >
                {v}
              </span>
            </div>
          ))}
        </div>

        {(writeError || sendError || simulateError) && (
          <div className="mb-4 rounded-[10px] border border-red-500/30 bg-red-500/10 p-3 text-[12px] text-red-400">
            {simulateError ?? (writeError ? getRevertReason(writeError) : sendError ? getRevertReason(sendError) : "")}
            <button
              type="button"
              onClick={() => {
                resetWrite()
                resetSend()
                setSimulateError(null)
              }}
              className="ml-2 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={handleConfirm}
          disabled={isPending || !isValid}
          className="w-full rounded-[11px] py-3 text-[13px] font-semibold text-white"
          style={{
            background: "linear-gradient(135deg,#22c55e,#15803d)",
            boxShadow: "0 0 22px rgba(34,197,94,0.22)",
          }}
        >
          {isPending ? "Confirming..." : "Create Vault"}
        </button>

        {txHash && (
          <TransactionDialog
            open
            hash={txHash}
            onOpenChange={() => setTxHash(undefined)}
          />
        )}
      </div>
    )
  }

  const foundCollateral = collaterals?.find(
    (c) => c.address.toLowerCase() === collateral?.toLowerCase()
  )
  const tokenName = foundCollateral?.tokenName ?? "WETH"

  return (
    <div className="flex flex-col gap-5">
      {/* Collateral selector */}
      <div>
        <div className="mb-2 text-xs font-medium text-zinc-500">Collateral</div>
        <ScrollableCollaterals
          collaterals={collaterals}
          placeholder="Select collateral"
          className="w-full"
          value={collateral ?? ""}
          onValueChange={(v) => {
            const addr = v?.trim()
            if (
              !addr ||
              addr === ADDRESS_ZERO ||
              addr === "0x" ||
              addr.length !== 42
            ) {
              setCollateral(undefined)
            } else {
              setCollateral(addr as `0x${string}`)
            }
          }}
        />
        {isWeth && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[11px] text-zinc-500">Deposit with:</span>
            <button
              type="button"
              onClick={() => setDepositWithNative(false)}
              className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                !depositWithNative
                  ? "bg-primary/20 text-primary"
                  : "text-zinc-500 hover:text-zinc-400"
              }`}
            >
              WETH (ERC20)
            </button>
            <button
              type="button"
              onClick={() => setDepositWithNative(true)}
              className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                depositWithNative
                  ? "bg-primary/20 text-primary"
                  : "text-zinc-500 hover:text-zinc-400"
              }`}
            >
              ETH (native)
            </button>
          </div>
        )}
      </div>

      {/* Collateral input */}
      <div>
        <div className="mb-2 flex justify-between text-xs font-medium text-zinc-500">
          <span>Amount</span>
          {balance !== undefined && (
            <span className="font-mono text-[11px]">
              Balance:{" "}
              <span className="text-zinc-400">
                {formatUnits(balance, decimals ?? 18)} {symbol}
              </span>
            </span>
          )}
        </div>
        <div className="relative">
          <input
            value={collateralInput}
            onChange={(e) => setCollateralInput(e.target.value)}
            placeholder="0.00"
            disabled={!collateral}
            className="w-full rounded-[11px] border bg-white/[0.04] px-4 py-3 pr-[110px] font-mono text-base text-zinc-100 caret-primary outline-none transition-[border-color] placeholder:text-zinc-600"
            style={{
              borderColor: "rgba(255,255,255,0.09)",
            }}
          />
          <div className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setCollateralInput(
                  balance ? formatUnits(balance, decimals ?? 18) : "0"
                )
              }
              className="rounded-md border px-2 py-1 font-mono text-[10px] text-primary"
              style={{
                background: "rgba(34,197,94,0.1)",
                borderColor: "rgba(34,197,94,0.2)",
              }}
            >
              MAX
            </button>
            <div
              className="flex items-center gap-1 rounded-md border px-2 py-1"
              style={{
                background: "rgba(255,255,255,0.06)",
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <TokenIcon symbol={tokenName} width={14} height={14} />
              <span className="font-mono text-[11px] text-zinc-400">
                {symbol}
              </span>
            </div>
          </div>
        </div>
        {collateralNum > 0 && (
          <div className="mt-1 font-mono text-[10px] text-zinc-500">
            ≈ ${collateralUSD.toLocaleString()} · Max borrow:{" "}
            {maxBorrowNum.toFixed(2)} vUSD
          </div>
        )}
      </div>

      {/* Borrow input */}
      <div>
        <div className="mb-2 flex justify-between text-xs font-medium text-zinc-500">
          <span>Borrow vUSD</span>
          {collateralNum > 0 && (
            <span className="font-mono text-[11px]">
              Max:{" "}
              <span className="text-zinc-400">{maxBorrowNum.toFixed(2)}</span>
            </span>
          )}
        </div>
        <div className="relative">
          <input
            value={borrowInput}
            onChange={(e) => {
              setBorrowInput(e.target.value)
              setIsBorrowSliderActive(false)
            }}
            placeholder="0.00"
            disabled={collateralNum === 0}
            className="w-full rounded-[11px] border bg-white/[0.04] px-4 py-3 pr-[100px] font-mono text-base caret-primary outline-none transition-[border-color] placeholder:text-zinc-600 disabled:cursor-not-allowed disabled:bg-white/[0.02] disabled:text-zinc-600"
            style={{
              borderColor:
                borrowNum > maxBorrowNum
                  ? "rgba(239,68,68,0.5)"
                  : "rgba(255,255,255,0.09)",
              color: collateralNum === 0 ? "#3f3f46" : "#f4f4f5",
            }}
          />
          <div
            className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-md border px-2 py-1"
            style={{
              background: "rgba(255,255,255,0.06)",
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <div
              className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-[7px] font-bold text-white"
              style={{ background: "linear-gradient(135deg,#22c55e,#15803d)" }}
            >
              v
            </div>
            <span className="font-mono text-[11px] text-zinc-400">vUSD</span>
          </div>
        </div>
        {borrowNum > maxBorrowNum && collateralNum > 0 && (
          <div className="mt-1 font-mono text-[10px] text-red-500">
            Exceeds maximum borrowable amount
          </div>
        )}

        {/* Borrow slider */}
        {collateralNum > 0 && (
          <div className="mt-3">
            <div className="relative flex h-5 items-center">
              <div className="absolute left-0 right-0 h-1 rounded-sm bg-white/[0.06]">
                <div
                  className="h-full rounded-sm transition-[width,background]"
                  style={{
                    width: `${sliderPct}%`,
                    background: `linear-gradient(90deg,#22c55e,${riskColor})`,
                  }}
                />
              </div>
              <input
                type="range"
                min="0"
                max="99"
                value={Math.round(sliderPct)}
                onChange={(e) => {
                  setIsBorrowSliderActive(true)
                  setBorrowSliderPct(parseFloat(e.target.value))
                }}
                className="absolute h-5 w-full cursor-pointer opacity-0"
              />
              <div
                className="pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-[#0c0c0e] transition-[background]"
                style={{
                  left: `${sliderPct}%`,
                  background: riskColor,
                  boxShadow: `0 0 8px ${riskColor}60`,
                }}
              />
            </div>
            <div className="mt-1 flex justify-between font-mono text-[9px] text-zinc-500">
              <span>Safe (150% CR)</span>
              <span>Min (110% CR)</span>
            </div>
            <div className="mt-2 flex gap-1">
              {[25, 50, 67, 90].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => {
                    setBorrowInput((maxBorrowNum * (pct / 100)).toFixed(2))
                    setIsBorrowSliderActive(false)
                  }}
                  className="flex-1 rounded-md border px-0 py-1 font-mono text-[10px] text-zinc-500 transition-colors hover:border-primary/30 hover:text-primary"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    borderColor: "rgba(255,255,255,0.07)",
                  }}
                >
                  {pct === 67 ? "Safe" : `${pct}%`}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Vault preview */}
      {collateralNum > 0 && borrowNum > 0 && (
        <div
          className="rounded-[14px] border p-4"
          style={{
            background: "rgba(255,255,255,0.02)",
            borderColor: `${color}22`,
          }}
        >
          <div className="mb-3.5 font-mono text-[9px] uppercase tracking-wider text-zinc-500">
            Vault Preview
          </div>
          <div className="flex items-center gap-4">
            <HFGauge hf={hf} size={90} />
            <div className="flex flex-1 flex-col gap-2">
              {[
                {
                  label: "Collateral Ratio",
                  val: isFinite(crPct) ? `${crPct.toFixed(1)}%` : "∞",
                  color: hfColor(hf),
                },
                {
                  label: "Borrow fee",
                  val: `${feeNum.toFixed(2)} vUSD (${feePercentageHuman}%)`,
                },
                {
                  label: "You receive",
                  val: `${borrowReceivedNum.toFixed(2)} vUSD`,
                  bold: true,
                },
              ].map((s) => (
                <div key={s.label} className="flex justify-between">
                  <span className="text-xs text-zinc-500">{s.label}</span>
                  <span
                    className="font-mono text-xs font-medium"
                    style={{
                      color: s.color ?? (s.bold ? "#f4f4f5" : "#a1a1aa"),
                    }}
                  >
                    {s.val}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {hf < 1.5 && isFinite(hf) && (
            <div
              className="mt-3 rounded-lg border p-3 text-[11px] leading-relaxed"
              style={{
                background:
                  hf < 1.3 ? "rgba(239,68,68,0.06)" : "rgba(234,179,8,0.06)",
                borderColor:
                  hf < 1.3 ? "rgba(239,68,68,0.2)" : "rgba(234,179,8,0.2)",
                color: hf < 1.3 ? "#fca5a5" : "#a16207",
              }}
            >
              {hf < 1.3
                ? "⚠ Very close to liquidation threshold. Consider borrowing less."
                : "⚠ Below safe ratio. Vulnerable to redemption if collateral price drops."}
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => isValid && setStep(2)}
        disabled={!isValid}
        className="rounded-[11px] py-3 text-[13px] font-semibold transition-all"
        style={{
          background: isValid
            ? "linear-gradient(135deg,#22c55e,#15803d)"
            : "rgba(255,255,255,0.05)",
          color: isValid ? "#fff" : "#52525b",
          border: isValid ? "none" : "1px solid rgba(255,255,255,0.07)",
          cursor: isValid ? "pointer" : "not-allowed",
          boxShadow: isValid ? "0 0 22px rgba(34,197,94,0.2)" : "none",
        }}
      >
        {!isValid
          ? collateralNum === 0
            ? "Enter collateral amount"
            : borrowNum === 0
              ? "Enter borrow amount"
              : borrowNum > maxBorrowNum
                ? "Exceeds maximum borrow"
                : "Review & Create"
          : "Review Vault"}
      </button>
    </div>
  )
}
