"use client"

import { useEffect, useState } from "react"
import {
  useReadContract,
  UseReadContractReturnType,
  useReadContracts,
} from "wagmi"

import { ADDRESS_ZERO } from "@/config/blockchain"

import useAbi from "./use-abi"
import useApiUrl from "./use-api-url"
import useInternalChainId from "./use-internal-chain-id"

export default function useVaultRealTime(address: `0x${string}`) {
  const internalChainId = useInternalChainId()

  const vaultAbi = useAbi("Vault")
  const vaultBorrowRateAbi = useAbi("VaultBorrowRate")

  const vaultContract = {
    abi: vaultAbi?.abi,
    address: address,
    chainId: internalChainId,
  }

  const vaultBorrowRateContract = {
    abi: vaultBorrowRateAbi?.abi,
    address: vaultBorrowRateAbi?.address,
    chainId: internalChainId,
  }

  const results = useReadContracts({
    contracts: [
      {
        ...vaultContract,
        functionName: "debt",
      },
      {
        ...vaultContract,
        functionName: "vaultOwner",
      },
      {
        ...vaultBorrowRateContract,
        functionName: "getBorrowRate",
        args: [address],
      },
      {
        ...vaultContract,
        functionName: "borrowableWithDiff",
        args: [ADDRESS_ZERO, 0, false, false],
      },
    ],
    query: {
      refetchInterval: 5000,
      refetchIntervalInBackground: true,
      enabled: !!vaultAbi?.abi && !!vaultBorrowRateAbi?.address,
    },
  })

  return {
    debt: results.data?.[0].result as bigint,
    vaultOwner: results.data?.[1].result,
    borrowRate: results.data?.[2].result as bigint,
    borrowable: results.data?.[3].result as bigint[],
    cashback: undefined,
    isLoading: results.isLoading,
  }
}
