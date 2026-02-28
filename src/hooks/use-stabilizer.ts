"use client"

import { formatUnits } from "viem"
import { erc20Abi } from "viem"
import { useReadContracts } from "wagmi"

import { vlendAddresses } from "@/config/blockchain"
import useInternalChainId from "./use-internal-chain-id"

const STABILIZER_ABI = [
  {
    inputs: [],
    name: "collateralToken",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "feeBps",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "scalingFactor",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const

export default function useStabilizer() {
  const chainId = useInternalChainId()
  const stabilizerAddress = vlendAddresses.stabilizer as `0x${string}`

  const contractResults = useReadContracts({
    contracts: [
      {
        abi: STABILIZER_ABI,
        address: stabilizerAddress,
        functionName: "collateralToken",
        chainId,
      },
      {
        abi: STABILIZER_ABI,
        address: stabilizerAddress,
        functionName: "feeBps",
        chainId,
      },
      {
        abi: STABILIZER_ABI,
        address: stabilizerAddress,
        functionName: "scalingFactor",
        chainId,
      },
    ],
    query: {
      refetchInterval: 10000,
      refetchIntervalInBackground: true,
    },
  })

  const collateralToken = contractResults.data?.[0]?.result as
    | `0x${string}`
    | undefined
  const feeBps = contractResults.data?.[1]?.result as bigint | undefined
  const scalingFactor = contractResults.data?.[2]?.result as bigint | undefined

  const balanceResults = useReadContracts({
    contracts:
      collateralToken && collateralToken !== "0x"
        ? [
            {
              abi: erc20Abi,
              address: collateralToken,
              functionName: "balanceOf",
              args: [stabilizerAddress],
              chainId,
            },
            {
              abi: erc20Abi,
              address: collateralToken,
              functionName: "decimals",
              chainId,
            },
          ]
        : [],
    query: {
      refetchInterval: 10000,
      enabled: !!collateralToken && collateralToken !== "0x",
    },
  })

  const totalUsdmRaw = balanceResults.data?.[0]?.result as bigint | undefined
  const collateralDecimals = balanceResults.data?.[1]?.result as
    | number
    | undefined
  const totalUsdmInContract =
    totalUsdmRaw !== undefined && collateralDecimals !== undefined
      ? formatUnits(totalUsdmRaw, collateralDecimals)
      : "0"

  return {
    collateralToken,
    feeBps: feeBps ?? BigInt(0),
    scalingFactor: scalingFactor ?? BigInt(1),
    totalUsdmInContract,
    feeBpsNum: feeBps !== undefined ? Number(feeBps) : 0,
    isLoading:
      contractResults.isLoading ||
      (!!collateralToken && balanceResults.isLoading),
  }
}
