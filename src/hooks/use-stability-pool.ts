import { useQuery } from "@tanstack/react-query"

import useApiUrl from "./use-api-url"

export type StabilityPoolOverview = {
  totalVusdStaked: string
  totalVusdStakedHuman: string
  totalVLENDRewards: string
  totalVLENDRewardsHuman: string
  totalVLENDRewardsInUsd: string
  totalVLENDRewardsInUsdHuman: string
  APR: string
  stakers: {
    address: string
    amount: string
  }[]
}

export default function useStabilityPool() {
  const apiUrl = useApiUrl()

  const { data: stabilityPoolOverview, isLoading } = useQuery({
    queryKey: ["stability-pool", apiUrl],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/stability_pool/overview`)
      const data = await res.json()
      if (data) {
        return {
          totalVusdStaked: data.totalVusdStaked ?? data.totalTusdStaked ?? "0",
          totalVusdStakedHuman:
            data.totalVusdStakedHuman ?? data.totalTusdStakedHuman ?? "0",
          totalVLENDRewards:
            data.totalVLENDRewards ?? data.totalTBANKRewards ?? "0",
          totalVLENDRewardsHuman:
            data.totalVLENDRewardsHuman ?? data.totalTBANKRewardsHuman ?? "0",
          totalVLENDRewardsInUsd:
            data.totalVLENDRewardsInUsd ?? data.totalTBANKRewardsInUsd ?? "0",
          totalVLENDRewardsInUsdHuman:
            data.totalVLENDRewardsInUsdHuman ??
            data.totalTBANKRewardsInUsdHuman ??
            "0",
          APR: data.APR ?? "0",
          stakers: data.stakers ?? [],
        } as StabilityPoolOverview
      }
      return undefined
    },
    staleTime: 15_000,
    gcTime: 5 * 60 * 1000,
  })

  return {
    stabilityPoolOverview,
    isLoading,
  }
}
