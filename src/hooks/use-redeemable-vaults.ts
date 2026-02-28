import { useQuery } from "@tanstack/react-query"

import useApiUrl from "./use-api-url"

export type RedeemableVault = {
  address: string
  debt: string
  debtHuman: string
  owner: string
  collateralAmount: string
  collateralAmountHuman: string
  collateralValue: string
  collateralValueHuman: string
  collateralToken: string
  collateralTokenSymbol: string
  maxReedemable: string
  maxReedemableHuman: string
  price: {
    priceInWei: string
    priceHuman: string
  }
  url: string
}

export default function useRedeemableVaults() {
  const apiUrl = useApiUrl()

  const { data: redeemableVaults, isLoading } = useQuery({
    queryKey: ["redeemable-vaults", apiUrl],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/redeemableVaults`)
      return res.json()
    },
    staleTime: 15_000,
    gcTime: 5 * 60 * 1000,
  })

  return {
    redeemableVaults: redeemableVaults ?? [],
    isLoading,
  }
}
