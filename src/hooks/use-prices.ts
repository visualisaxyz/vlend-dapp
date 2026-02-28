import { useQuery } from "@tanstack/react-query"

import useApiUrl from "./use-api-url"

export type Prices = {
  VLEND: number
  vUSD: number
}

export default function usePrices() {
  const apiUrl = useApiUrl()

  const { data: prices, isLoading } = useQuery({
    queryKey: ["prices", apiUrl],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/prices`)
      const data = await res.json()
      return {
        VLEND: data.VLEND ?? 0,
        vUSD: data.vUSD ?? 0,
      } as Prices
    },
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
  })

  return { prices, isLoading }
}
