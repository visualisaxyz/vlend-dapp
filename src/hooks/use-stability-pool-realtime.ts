"use client"

import { useReadContracts } from "wagmi"
import { useAccount } from "wagmi"
import useInternalChainId from "./use-internal-chain-id"
import useAbi from "./use-abi"

export default function useStabilityPoolRealTime(customAddress: `0x${string}` = "0x") {
  const { address } = useAccount()
  const stabilityPoolAbi = useAbi("StabilityPool")
  const chainId = useInternalChainId()

  const depositorAddress = customAddress !== "0x" ? customAddress : (address ?? "0x")

  const results = useReadContracts({
    contracts: [
      {
        abi: stabilityPoolAbi?.abi,
        address: stabilityPoolAbi?.address as `0x${string}`,
        functionName: "deposits",
        args: [depositorAddress],
        chainId,
      },
      {
        abi: stabilityPoolAbi?.abi,
        address: stabilityPoolAbi?.address as `0x${string}`,
        functionName: "getDepositorVLENDGain",
        args: [depositorAddress],
        chainId,
      },
      {
        abi: stabilityPoolAbi?.abi,
        address: stabilityPoolAbi?.address as `0x${string}`,
        functionName: "getWithdrawableDeposit",
        args: [depositorAddress],
        chainId,
      },
    ],
    query: {
      refetchInterval: 5000,
      refetchIntervalInBackground: true,
      enabled: !!stabilityPoolAbi?.address && !!stabilityPoolAbi?.abi,
    },
  })

  const stake = results.data?.[0]?.result as bigint | undefined
  const rewards = results.data?.[1]?.result as bigint | undefined
  const withdrawableDeposit = results.data?.[2]?.result as bigint | undefined

  return {
    stake,
    rewards,
    withdrawableDeposit: withdrawableDeposit ?? stake,
    isLoading: results.isLoading || stabilityPoolAbi?.isLoading,
  }
}
