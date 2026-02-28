"use client"

import { formatEther } from "viem"
import { useAccount } from "wagmi"
import { useReadContracts } from "wagmi"

import { vlendAddresses } from "@/config/blockchain"

import useInternalChainId from "./use-internal-chain-id"

const VLEND_STAKING_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "rewardTokens",
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "account", type: "address" },
      { name: "rewardsToken", type: "address" },
    ],
    name: "earned",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const

export default function useVlendStaking() {
  const { address } = useAccount()
  const chainId = useInternalChainId()

  const results = useReadContracts({
    contracts: [
      {
        abi: VLEND_STAKING_ABI,
        address: vlendAddresses.vlendStaking,
        functionName: "balanceOf",
        args: [address ?? "0x"],
        chainId,
      },
      {
        abi: VLEND_STAKING_ABI,
        address: vlendAddresses.vlendStaking,
        functionName: "totalSupply",
        chainId,
      },
      {
        abi: VLEND_STAKING_ABI,
        address: vlendAddresses.vlendStaking,
        functionName: "rewardTokens",
        chainId,
      },
    ],
    query: {
      refetchInterval: 5000,
      refetchIntervalInBackground: true,
      enabled: !!address && !!chainId,
    },
  })

  const vlendStaked = results.data?.[0]?.result as bigint | undefined
  const totalVlendStaked = results.data?.[1]?.result as bigint | undefined
  const rewardTokens = results.data?.[2]?.result as `0x${string}`[] | undefined

  const earnedContracts =
    rewardTokens && address
      ? rewardTokens.map((token) => ({
          abi: VLEND_STAKING_ABI,
          address: vlendAddresses.vlendStaking,
          functionName: "earned" as const,
          args: [address, token] as const,
          chainId,
        }))
      : []

  const earnedResults = useReadContracts({
    contracts: earnedContracts,
    query: {
      refetchInterval: 5000,
      enabled: earnedContracts.length > 0,
    },
  })

  const rewardsBigInt =
    earnedResults.data?.reduce(
      (sum, r) => sum + BigInt((r?.result as bigint) ?? 0),
      BigInt(0)
    ) ?? BigInt(0)

  return {
    vlendStaked,
    totalVlendStaked,
    rewards: rewardsBigInt,
    rewardsHuman: formatEther(rewardsBigInt),
    rewardTokens,
    isLoading:
      results.isLoading ||
      (earnedContracts.length > 0 && earnedResults.isLoading),
  }
}
