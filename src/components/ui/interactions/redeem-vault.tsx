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
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { Slider } from "../slider"
import SpinnerLoader from "../spinner-loader"
import TokenIcon from "../token-icon"
import TransactionWrapper from "./transaction-wrapper"

export default function RedeemVault({
  vault,
  collateral,
  redeemableValue,
  children,
}: {
  vault: `0x${string}`
  collateral: `0x${string}`
  redeemableValue: string
  children?: React.ReactNode
}) {
  const [percentage, setPercentage] = useState(0)
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined)

  const vaultAbi = useAbi("Vault")
  const chainId = useInternalChainId()
  const { address } = useAccount()

  const stableAbi = useAbi("MintableToken")
  const vaultFactoryAbi = useAbi("VaultFactory")

  const debt = useReadContract({
    abi: vaultAbi?.abi,
    address: vault,
    chainId: chainId,
    functionName: "debt",
    query: {
      refetchIntervalInBackground: true,
      refetchInterval: 5000,
    },
  })

  const collateralData = useCollateralBalance(collateral, vault, false)

  const redeemableValueBN = BigInt(redeemableValue)
  let realRedeemableValue = redeemableValueBN
  if (collateralData.balance && redeemableValueBN > collateralData.balance) {
    realRedeemableValue = collateralData.balance
  }
  const collateralAmount =
    (realRedeemableValue * BigInt(percentage)) / BigInt(100)

  const calcRedeem = useReadContract({
    abi: vaultAbi?.abi,
    address: vault,
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

  useEffect(() => {
    if (debt.data !== undefined && debt.data !== null) {
      if (debtRepaid > (debt.data as bigint)) {
        setPercentage((prevPercentage) => {
          return prevPercentage - 5
        })
      }
    }
  }, [debtRepaid, percentage])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (
      vaultFactoryAbi.address === undefined ||
      vaultFactoryAbi.abi === undefined
    )
      return
    if (stableAbi.address === undefined) return
    if (!address) return

    if (isApproved) {
      writeContract({
        abi: vaultFactoryAbi.abi,
        address: vaultFactoryAbi.address,
        chainId: chainId,
        functionName: "redeem",
        args: [vault, collateral, collateralAmount, address],
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
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Redeem</DialogTitle>
            <div className="mt-4 text-sm text-muted-foreground">
              <TransactionWrapper txHash={txHash}>
                <>
                  <div className="mb-4 mt-4">
                    {collateralData.balance && collateralData.decimals ? (
                      <>
                        <div className="mt-2 flex items-center justify-between">
                          <Label>You get</Label>
                          <div className="flex items-center space-x-1 align-middle">
                            <code>
                              {formatUnits(
                                collateralAmount,
                                collateralData.decimals
                              )}
                            </code>
                            <div> {collateralData.symbol}</div>
                            <TokenIcon symbol={collateralData.symbol} />
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between align-middle">
                          <Label>You pay</Label>
                          <div className="flex items-center space-x-1 align-middle">
                            <code>{formatUnits(payAmount, 18)}</code>
                            <div> vUSD</div>
                            <TokenIcon symbol={"vUSD"} />
                          </div>
                        </div>
                      </>
                    ) : (
                      <></>
                    )}
                    <Slider
                      className="mt-4"
                      defaultValue={[percentage]}
                      value={[percentage]}
                      max={100}
                      step={1}
                      onValueChange={(value) => {
                        setPercentage(value[0])
                      }}
                    />
                  </div>
                </>
              </TransactionWrapper>
              <TransactionWrapper txHash={txHash} status="success">
                <div className="flex flex-col items-center space-y-2">
                  <div>Your transaction has been processed.</div>
                  <div>
                    <Check className="text-green-500" />
                  </div>
                  <div>
                    <Link
                      href={txHashLink(chainId, txHash ?? "")}
                      target="_blank"
                      rel="noreferrer"
                      className="text-lime-500 transition-all duration-200 ease-in-out hover:underline"
                    >
                      View on block explorer
                    </Link>
                  </div>
                </div>
              </TransactionWrapper>
              <TransactionWrapper txHash={txHash} status="pending">
                <div className="flex flex-col items-center space-y-2">
                  <div>Your transaction is being processed.</div>
                  <div>
                    <SpinnerLoader />
                  </div>
                  <div>
                    <Link
                      href={txHashLink(chainId, txHash ?? "")}
                      target="_blank"
                      rel="noreferrer"
                      className="text-lime-500 transition-all duration-200 ease-in-out hover:underline"
                    >
                      View on block explorer
                    </Link>
                  </div>
                </div>
              </TransactionWrapper>
              <TransactionWrapper txHash={hash} status="error">
                <div className="flex flex-col items-center space-y-2">
                  <div>There was an error processing your transaction.</div>
                </div>
              </TransactionWrapper>
            </div>
          </DialogHeader>
          <TransactionWrapper txHash={txHash}>
            <DialogFooter>
              <Button type="submit">
                {isApproved ? <>Redeem</> : <>Approve vUSD</>}
              </Button>
            </DialogFooter>
          </TransactionWrapper>
        </form>
      </DialogContent>
    </Dialog>
  )
}
