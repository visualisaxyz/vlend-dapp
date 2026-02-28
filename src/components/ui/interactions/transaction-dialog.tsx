"use client"

import { useState } from "react"
import Link from "next/link"
import { Check } from "lucide-react"
import { useReadContract, useWriteContract } from "wagmi"

import { txHashLink } from "@/lib/utils"
import useAbi from "@/hooks/use-abi"
import useInternalChainId from "@/hooks/use-internal-chain-id"
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

import SpinnerLoader from "../spinner-loader"
import StyledButton from "../styled-button"
import TransactionWrapper from "./transaction-wrapper"

export default function TransactionDialog({
  hash,
  open,
  onOpenChange,
  children,
}: {
  hash: `0x${string}`
  open: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}) {
  const chainId = useInternalChainId()

  return (
    <Dialog defaultOpen={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Transaction in progress...</DialogTitle>
          <div className="mt-4 text-sm text-muted-foreground">
            <TransactionWrapper txHash={hash} status="success">
              <div className="flex flex-col items-center space-y-2">
                <div>Your transaction has been processed.</div>
                <div>
                  <Check className="text-green-500" />
                </div>
                <div>
                  <Link
                    href={txHashLink(chainId, hash ?? "")}
                    target="_blank"
                    rel="noreferrer"
                    className="text-lime-500 transition-all duration-200 ease-in-out hover:underline"
                  >
                    View on block explorer
                  </Link>
                </div>
                <div>{children}</div>
              </div>
            </TransactionWrapper>
            <TransactionWrapper txHash={hash} status="pending">
              <div className="flex flex-col items-center space-y-2">
                <div>Your transaction is being processed.</div>
                <div>
                  <SpinnerLoader />
                </div>
                <div>
                  <Link
                    href={txHashLink(chainId, hash ?? "")}
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
      </DialogContent>
    </Dialog>
  )
}
