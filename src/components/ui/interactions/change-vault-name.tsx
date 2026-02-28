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
import TransactionWrapper from "./transaction-wrapper"

export default function ChangeVaultName({
  vault,
  children,
}: {
  vault: `0x${string}`
  children?: React.ReactNode
}) {
  const vaultAbi = useAbi("Vault")
  const chainId = useInternalChainId()
  const name = useReadContract({
    abi: vaultAbi?.abi,
    address: vault,
    chainId: chainId,
    functionName: "name",
    query: {
      refetchIntervalInBackground: false,
    },
  })

  const { data: hash, writeContract } = useWriteContract()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const name = new FormData(event.currentTarget).get("name") as string

    if (name.trim() === "") return
    if (vaultAbi.abi === undefined) return

    writeContract({
      abi: vaultAbi?.abi,
      address: vault,
      chainId: chainId,
      functionName: "setName",
      args: [name],
    })
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Change Vault Name</DialogTitle>
            <div className="mt-4 text-sm text-muted-foreground">
              <TransactionWrapper txHash={hash}>
                You can change your Vault name,
                <br />
                this action will require an on-chain transaction.
              </TransactionWrapper>
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
          <TransactionWrapper txHash={hash}>
            <>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-left">
                    Name
                  </Label>
                  <Input
                    name="name"
                    id="name"
                    className="col-span-3"
                    defaultValue={name?.data as string}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="submit">Change</Button>
              </DialogFooter>
            </>
          </TransactionWrapper>
        </form>
      </DialogContent>
    </Dialog>
  )
}
