"use client"

import { useEffect, useState } from "react"
import { erc20Abi } from "viem"
import {
  useAccount,
  useBalance,
  useReadContract,
  UseReadContractReturnType,
  useReadContracts,
} from "wagmi"

import { nativeWrappedTokens } from "@/config/blockchain"

import useAbi from "./use-abi"
import useApiUrl from "./use-api-url"
import useInternalChainId from "./use-internal-chain-id"

export default function useCollateralBalance(
  collateralAddress: `0x${string}` | undefined,
  customAddress: `0x${string}` = "0x",
  useNativeBalance: boolean = true
) {
  const { address } = useAccount()
  const chainId = useInternalChainId()

  const nativeWrapped =
    nativeWrappedTokens[chainId as keyof typeof nativeWrappedTokens]

  const nativeBalance = useBalance({
    chainId: chainId,
    address: customAddress !== "0x" ? customAddress : (address ?? "0x"),
  })

  const results = useReadContracts({
    contracts: [
      {
        abi: erc20Abi,
        address: collateralAddress,
        functionName: "balanceOf",
        args: [customAddress !== "0x" ? customAddress : (address ?? "0x")],
        chainId: chainId,
      },
      {
        abi: erc20Abi,
        address: collateralAddress,
        functionName: "decimals",
        chainId: chainId,
      },
      {
        abi: erc20Abi,
        address: collateralAddress,
        functionName: "symbol",
        chainId: chainId,
      },
    ],
    query: {
      refetchInterval: 5000,
      refetchIntervalInBackground: true,
    },
  })

  const balance =
    collateralAddress?.toLowerCase() === nativeWrapped?.toLowerCase() &&
    useNativeBalance
      ? nativeBalance?.data?.value
      : results.data?.[0].result
  const decimals =
    collateralAddress?.toLowerCase() === nativeWrapped?.toLowerCase()
      ? 18
      : results.data?.[1].result
  const symbol =
    collateralAddress?.toLowerCase() === nativeWrapped?.toLowerCase() &&
    useNativeBalance
      ? nativeBalance?.data?.symbol
      : results.data?.[2].result

  return {
    balance,
    decimals,
    symbol,
  }
}
