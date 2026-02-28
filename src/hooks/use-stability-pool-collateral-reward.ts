"use client"

import { formatEther } from "viem"
import { useAccount } from "wagmi"
import { useReadContract } from "wagmi"

import { vlendAddresses } from "@/config/blockchain"

import useAbi from "./use-abi"
import useInternalChainId from "./use-internal-chain-id"

export default function useStabilityPoolCollateralReward(
  customAddress: `0x${string}` = "0x"
) {
  const { address } = useAccount()
  const stabilityPoolAbi = useAbi("StabilityPool")
  const chainId = useInternalChainId()

  const depositorAddress =
    customAddress !== "0x" ? customAddress : (address ?? "0x")

  const { data: wethReward, isLoading } = useReadContract({
    abi: stabilityPoolAbi?.abi,
    address: stabilityPoolAbi?.address as `0x${string}`,
    functionName: "getCollateralReward",
    args: [vlendAddresses.weth as `0x${string}`, depositorAddress],
    chainId,
    query: {
      refetchInterval: 5000,
      enabled:
        !!stabilityPoolAbi?.address &&
        !!stabilityPoolAbi?.abi &&
        depositorAddress !== "0x",
    },
  })

  const reward = (wethReward as bigint | undefined) ?? BigInt(0)
  return {
    wethReward: reward,
    wethRewardHuman: formatEther(reward),
    isLoading: isLoading || stabilityPoolAbi?.isLoading,
  }
}
