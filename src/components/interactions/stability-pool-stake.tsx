import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Forward, PlusSquare, SendHorizonal } from "lucide-react"
import {
  erc20Abi,
  formatEther,
  formatUnits,
  parseEther,
  parseUnits,
} from "viem"
import { useAccount, useWriteContract } from "wagmi"

import {
  MAX_ALLOWANCE,
  nativeWrappedTokens,
  vlendAddresses,
} from "@/config/blockchain"
import { cn } from "@/lib/utils"
import useAbi from "@/hooks/use-abi"
import useCollateralBalance from "@/hooks/use-collateral-balance"
import useCollaterals from "@/hooks/use-collaterals"
import useInternalChainId from "@/hooks/use-internal-chain-id"
import useStabilityPoolRealTime from "@/hooks/use-stability-pool-realtime"
import useTokenApproval from "@/hooks/use-token-approval"
import { VaultInfo } from "@/hooks/use-vault"
import useVaultRealTime from "@/hooks/use-vault-real-time"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import FloatToCurrency from "../ui/floatToCurrency"
import FloatToPrettyNumber from "../ui/floatToPrettyNumber"
import GradientSeparator from "../ui/gradient-separator"
import { Input } from "../ui/input"
import TransactionDialog from "../ui/interactions/transaction-dialog"
import { Label } from "../ui/label"
import ScrollableCollaterals from "../ui/scrollable-collaterals"
import { Separator } from "../ui/separator"
import SpinnerLoader from "../ui/spinner-loader"
import StatisticsCard from "../ui/statistics-card"
import StyledButton from "../ui/styled-button"
import TokenIcon from "../ui/token-icon"

function setCollateralInputValue(
  ref: React.RefObject<HTMLInputElement>,
  value: string
) {
  if (ref.current !== null) {
    ref.current.value = value
  }
}

export default function StabilityPoolStake({
  className,
}: {
  className?: string
}) {
  const stabilityPoolAbi = useAbi("StabilityPool")
  const chainId = useInternalChainId()

  const stakeAddRef = useRef<HTMLInputElement>(null)
  const stakeRemoveRef = useRef<HTMLInputElement>(null)

  const [amount, setAmount] = useState<string | undefined>(undefined)

  const { data: hash, writeContract, isPending } = useWriteContract()

  const mintableTokenAbi = useAbi("MintableToken")

  const { stake: currentStake } = useStabilityPoolRealTime()

  const [submitLabel, setSubmitLabel] = useState("Confirm")
  const [addDisabled, setAddDisabled] = useState(false)
  const [removeDisabled, setRemoveDisabled] = useState(false)
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined)
  const [collateral, setCollateral] = useState<`0x${string}` | undefined>(
    undefined
  )

  const [maxWithdraw, setMaxWithdraw] = useState(BigInt(0))

  const { balance, decimals, symbol } = useCollateralBalance(collateral)

  const { isApproved } = useTokenApproval(
    collateral,
    (stabilityPoolAbi?.address ?? "0x") as `0x${string}`,
    parseUnits(amount ?? "0", decimals ?? 18)
  )

  useEffect(() => {
    setCollateral(
      (mintableTokenAbi?.address ?? vlendAddresses.mintableToken) as `0x${string}`
    )
  }, [mintableTokenAbi])

  useEffect(() => {
    if (hash !== undefined) {
      setTxHash(hash)
    }
  }, [hash])

  useEffect(() => {
    if (
      !addDisabled &&
      !isApproved &&
      collateral !== undefined &&
      collateral.toLowerCase() !==
        nativeWrappedTokens[
          chainId as keyof typeof nativeWrappedTokens
        ].toLowerCase()
    ) {
      if (amount !== undefined && amount !== "") {
        setSubmitLabel("Approve")
      } else {
        setSubmitLabel("Select action")
      }
    } else {
      if (!addDisabled) setSubmitLabel("Stake")
      else if (!removeDisabled) setSubmitLabel("Withdraw")
      else setSubmitLabel("Confirm")
    }
  }, [isApproved, addDisabled, collateral, nativeWrappedTokens, chainId])

  let maxWithdrawable = formatEther(
    currentStake && currentStake > 0 ? currentStake : BigInt(0)
  )

  useEffect(() => {
    if (currentStake) {
      setMaxWithdraw(currentStake)
    }
  }, [currentStake, txHash])

  return (
    <div className="flex w-full flex-col items-center gap-4 md:w-[50%]">
      <StatisticsCard title="" className="mt-4 w-full sm:mt-0">
        <div className="flex w-fit flex-row items-center justify-between rounded-full border-[1px] border-primary border-opacity-20 px-2 ">
          <TokenIcon symbol="vUSD" width={25} height={25} />
        </div>
        <div className="py-2 text-xl text-primary">Stake/Unstake</div>
        <div className="mb-4 text-pretty text-xs text-primary">
          Stake <span className="text-primary">vUSD</span> to protect the
          protocol via automated liquidations and earn rewards in{" "}
          <span className="text-primary">VLEND</span>
        </div>
        <GradientSeparator />
        <div className="mb-2 text-pretty text-xs text-muted-foreground">
          <StyledButton link="/swap">
            <div className="flex items-center space-x-1 pr-2 font-semibold">
              <TokenIcon symbol="vUSD" invert />
              <div>Buy vUSD</div>
            </div>
          </StyledButton>
        </div>
        <div className="mb-4 text-pretty text-xs text-primary opacity-60">
          *Stake/Unstake will automatically claim any pending{" "}
          <span className="text-primary">VLEND</span>
        </div>
      </StatisticsCard>
      <StatisticsCard className="w-full">
        <div className="py-2 text-xl text-primary">Stake</div>

        <div className="mb-4 text-pretty text-xs text-primary">
          Stake <span className="text-primary">vUSD</span> to protect the
          protocol via automated liquidations and earn rewards in{" "}
          <span className="text-primary">VLEND</span>
        </div>
        <div className="flex w-full flex-row items-center justify-between pr-4">
          <Input
            type="number"
            name="stakeAdd"
            min="0"
            placeholder="Enter the amount"
            className="w-full border-[0.5px] border-primary border-opacity-20 bg-primary bg-opacity-10"
            disabled={collateral === undefined || addDisabled}
            ref={stakeAddRef}
            onChange={(event) => {
              if (event.target.value === "") {
                setRemoveDisabled(false)
              } else {
                setRemoveDisabled(true)
              }

              setAmount(event.target.value)
            }}
          />
          <div className="">
            {balance !== undefined && (
              <div
                className="flex cursor-pointer items-center px-4 text-base transition-all duration-200 ease-in  hover:opacity-50"
                onClick={() => {
                  setCollateralInputValue(
                    stakeAddRef,
                    formatUnits(balance ?? BigInt(0), decimals ?? 18)
                  )
                  setAmount(stakeAddRef.current?.value)
                  if (stakeAddRef.current !== null) {
                    setAddDisabled(false)
                    stakeAddRef.current.focus()
                    if (stakeRemoveRef.current !== null) {
                      stakeRemoveRef.current.value = ""
                      setRemoveDisabled(true)
                    }
                  }
                }}
              >
                <TokenIcon symbol="vUSD" width={30} height={30} />
                <div className="flex flex-row items-center gap-1 text-sm text-primary">
                  <div className=""> Balance: </div>
                  <code>
                    <FloatToPrettyNumber>
                      {formatUnits(balance ?? BigInt(0), decimals ?? 18)}
                    </FloatToPrettyNumber>{" "}
                  </code>
                  {symbol}
                </div>
              </div>
            )}
          </div>
        </div>
        <GradientSeparator className="mt-4" />

        <div className="mb-2 text-pretty pt-0 text-xs text-muted-foreground">
          <StyledButton
            isLoading={isPending === true}
            className="flex w-fit items-center px-2"
            disabled={txHash !== undefined}
            onClick={() => {
              if (
                stabilityPoolAbi.abi &&
                stabilityPoolAbi.address &&
                decimals
              ) {
                if (addDisabled && amount && collateral) {
                  writeContract({
                    abi: stabilityPoolAbi.abi,
                    address: stabilityPoolAbi.address as `0x${string}`,
                    chainId,
                    functionName: "withdraw",
                    args: [parseUnits(amount, decimals)],
                    gas: BigInt(5_000_000),
                  })
                }

                if (removeDisabled && amount && collateral) {
                  if (isApproved) {
                    writeContract({
                      abi: stabilityPoolAbi.abi,
                      address: stabilityPoolAbi.address as `0x${string}`,
                      chainId,
                      functionName: "deposit",
                      args: [parseUnits(amount, decimals)],
                      gas: BigInt(5_000_000),
                    })
                  } else {
                    writeContract({
                      abi: erc20Abi,
                      address: collateral,
                      chainId,
                      functionName: "approve",
                      args: [stabilityPoolAbi.address, MAX_ALLOWANCE],
                    })
                  }
                }
              }
            }}
          >
            <div className="flex items-center space-x-1 px-4 py-0 text-sm font-semibold">
              <div>Start Stake</div>
            </div>
          </StyledButton>
        </div>
      </StatisticsCard>
      <StatisticsCard className="w-full">
        <div className="py-2 text-xl text-primary">Unstake</div>

        <div className="mb-4 text-pretty text-xs text-primary">
          Stake <span className="text-primary">vUSD</span> to protect the
          protocol via automated liquidations and earn rewards in{" "}
          <span className="text-primary">VLEND</span>
        </div>
        <div className="flex w-full flex-row items-center justify-between pr-4">
          <Input
            type="number"
            name="stakeRemove"
            min="0"
            placeholder="Enter the amount"
            className="w-full border-[0.5px] border-primary border-opacity-20 bg-primary bg-opacity-10"
            disabled={collateral === undefined || removeDisabled}
            ref={stakeRemoveRef}
            onChange={(event) => {
              if (event.target.value === "") {
                setAddDisabled(false)
              } else {
                setAddDisabled(true)
              }

              setAmount(event.target.value)
            }}
          />
          <div className="pl-4 ">
            {balance !== undefined && (
              <div
                className="flex cursor-pointer items-center space-x-2 text-foreground transition-all duration-200 ease-in hover:opacity-50"
                onClick={() => {
                  setCollateralInputValue(stakeRemoveRef, maxWithdrawable)
                  setAmount(stakeRemoveRef.current?.value)
                  if (stakeRemoveRef.current !== null) {
                    setRemoveDisabled(false)
                    stakeRemoveRef.current.focus()
                    if (stakeAddRef.current !== null) {
                      stakeAddRef.current.value = ""
                      setAddDisabled(true)
                    }
                  }
                }}
              >
                <TokenIcon symbol="vUSD" width={30} height={30} />
                <div className="flex w-[13rem] flex-row items-center gap-1 text-sm text-primary">
                  Staked Balance:
                  <code>
                    <FloatToPrettyNumber>{maxWithdrawable}</FloatToPrettyNumber>
                  </code>
                  {symbol}
                </div>
              </div>
            )}
          </div>
        </div>
        <GradientSeparator className="mt-4" />

        <div className="mb-2 text-pretty pt-0 text-xs text-muted-foreground">
          <StyledButton
            isLoading={isPending === true}
            className="flex w-fit items-center px-2"
            disabled={txHash !== undefined}
            onClick={() => {
              if (
                stabilityPoolAbi.abi &&
                stabilityPoolAbi.address &&
                decimals
              ) {
                if (addDisabled && amount && collateral) {
                  writeContract({
                    abi: stabilityPoolAbi.abi,
                    address: stabilityPoolAbi.address as `0x${string}`,
                    chainId,
                    functionName: "withdraw",
                    args: [parseUnits(amount, decimals)],
                  })
                }

                if (removeDisabled && amount && collateral) {
                  if (isApproved) {
                    writeContract({
                      abi: stabilityPoolAbi.abi,
                      address: stabilityPoolAbi.address as `0x${string}`,
                      chainId,
                      functionName: "deposit",
                      args: [parseUnits(amount, decimals)],
                    })
                  } else {
                    writeContract({
                      abi: erc20Abi,
                      address: collateral,
                      chainId,
                      functionName: "approve",
                      args: [stabilityPoolAbi.address, MAX_ALLOWANCE],
                    })
                  }
                }
              }
            }}
          >
            <div className="flex items-center space-x-1 px-4 py-0 text-sm font-semibold">
              <div>Unstake</div>
            </div>
          </StyledButton>

          {txHash && (
            <TransactionDialog
              open={true}
              hash={txHash}
              onOpenChange={() => {
                setTxHash(undefined)
              }}
            />
          )}
        </div>
      </StatisticsCard>
    </div>
  )
}
