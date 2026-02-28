import { useQuery } from "@tanstack/react-query"

import useApiUrl from "./use-api-url"

export type VaultsUnderHealthFactorLimit = {
  address: string
  url: string
  healthFactor: number
  healthFactorLimit: number
}

export type Statistics = {
  tvl: string
  circulatingVUSD: string
  vusdInStabilityPool: string
  VLENDinStaking: string
  totalProtocolFees: string
  totalVaultsCreated: number
  avgCollateralPerVault: string
  avgDebtPerVault: string
  collateralBackingPerVusd: string
  healthFactor: {
    min: number
    max: number
    avg: number
    redemptionLimit: string
  }
  vaultsUnderHealthFactorLimit: VaultsUnderHealthFactorLimit[]
  collateralData?: {
    tokenName: string
    address: string
    mcr: number
    mlr: number
    decimals: number
    oracle: string
    oracleType: string
    borrowRate: number
    cap: number
    capUsage: number
    capUsagePercentage: string
    price: string
    capInUsd: number
    capUsageInUsd: number
  }[]
}

export default function useStatistics(_chainId?: number) {
  const apiUrl = useApiUrl()

  const { data: statistics, isLoading } = useQuery({
    queryKey: ["statistics", apiUrl],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/protocolStats`)
      const data = await res.json()
      if (data?.data?.[0]?.data) {
        const raw = data.data[0].data
        const tvl =
          raw.tvl ??
          raw.totalTvl ??
          raw.protocolTvl ??
          (typeof raw.TVL === "number" ? String(raw.TVL) : raw.TVL) ??
          "0"
        return {
          ...raw,
          tvl: typeof tvl === "number" ? String(tvl) : tvl,
          circulatingVUSD: raw.circulatingVUSD ?? raw.circulatingTUSD ?? "0",
          vusdInStabilityPool:
            raw.vusdInStabilityPool ?? raw.tusdInStabilityPool ?? "0",
          VLENDinStaking:
            raw.VLENDinStaking ?? raw.TBANKinCashbackPool ?? "0",
          collateralBackingPerVusd:
            raw.collateralBackingPerVusd ?? raw.collateralBackingPerTusd ?? "0",
        } as Statistics
      }
      return undefined
    },
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
  })

  return { statistics, isLoading }
}
