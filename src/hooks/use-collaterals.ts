"use client"

import { useQuery } from "@tanstack/react-query"
import { useChainId } from "wagmi"

import useApiUrl from "./use-api-url"

export type Collateral = {
  tokenName: string
  address: string
  mcr: number
  mlr: number
  decimals: number
  oracle: string
  oracleType: string
  borrowRate: number
  price?: string
  fixedPrice?: string
}

export default function useCollaterals() {
  const apiUrl = useApiUrl()
  const chainId = useChainId()

  const { data: collaterals, isLoading } = useQuery({
    queryKey: ["collaterals", apiUrl, chainId],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/collaterals?chainId=${chainId ?? 4326}`)
      const data = await res.json()

      const pricePromises = data.map(async (collateral: Collateral) => {
        try {
          const priceRes = await fetch(
            `${apiUrl}/collaterals/price/${collateral.address}`
          )
          const priceData = await priceRes.json()
          return {
            ...collateral,
            price: priceData.priceHuman,
          }
        } catch {
          return { ...collateral, price: undefined }
        }
      })
      return Promise.all(pricePromises)
    },
    staleTime: 60_000,
    gcTime: 10 * 60 * 1000,
  })

  return { collaterals: collaterals ?? [], isLoading }
}
