import { useCallback, useEffect, useState } from "react"

import useApiUrl from "./use-api-url"

/*
{
"address": "0xcda4B3a813978C2d05276797957395131805412C",
"collaterals": [
"0x36B77a184bE8ee56f5E81C56727B20647A42e28E"
],
"vaultName": "MyVault2",
"owner": "0xE484A833e2b0516F5b3F851fDE3F462B365716Da",
"debt": "47533.230686101160778106",
"healthFactor": "1.060668075369645109",
"liquidationFactor": "1.42782240915144534",
"liquidationThreshold": "61793.20",
"redemptionFactor": "1.3",
"redemptionThreshold": "52206.93",
"borrowable": "2883.749621827112956998",
"tvl": "88229.715538874479036433",
"collateralInfo": [
{
"address": "0x36B77a184bE8ee56f5E81C56727B20647A42e28E",
"amount": "912.986",
"price": "96.638629221997357064",
"valueInUsd": "88229.715538874479036433",
"decimals": 18,
"symbol": "QNT",
"isRedeemable": true,
"maxWithdrawable": 52.22
}
]
}*/

export type VaultInfo = {
  debtHuman: string | number | undefined
  address: string
  collaterals: string[]
  vaultName: string
  owner: string
  /** API may return vaultOwner instead of owner */
  vaultOwner?: string
  debt: string
  healthFactor: string
  liquidationFactor: string
  liquidationThreshold: string
  redemptionFactor: string
  redemptionThreshold: string
  borrowable: string
  tvl: string
  collateralInfo: {
    address: string
    amount: string
    price: string
    valueInUsd: string
    decimals: number
    symbol: string
    isRedeemable: boolean
    maxWithdrawable: string
  }[]
}

export default function useVault(address: string, refetchInterval: number = 0) {
  const apiUrl = useApiUrl()
  const [vault, setVault] = useState<VaultInfo | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)

  const tryOverviewFallback = useCallback(() => {
    const addr = address?.trim()
    if (!addr || addr.length < 10) {
      setVault(undefined)
      setIsLoading(false)
      return
    }
    fetch(`${apiUrl}/vaults/overview`)
      .then((r) => r.json())
      .then((raw: unknown) => {
        const vaults = Array.isArray(raw)
          ? raw
          : (raw as { vaults?: unknown[] })?.vaults ??
            (raw as { data?: unknown[] })?.data ??
            []
        const list = Array.isArray(vaults) ? vaults : []
        const addrLower = addr.toLowerCase()
        const found = list.find((v: unknown) => {
          if (typeof v !== "object" || v === null) return false
          const o = v as Record<string, unknown>
          const a =
            (o.address as string) ??
            (o.vaultAddress as string) ??
            (o.id as string)
          return typeof a === "string" && a.toLowerCase() === addrLower
        }) as Record<string, unknown> | undefined
        if (found) {
          const f = found as Record<string, unknown>
          setVault({
            address: (f.address as string) ?? "",
            collaterals: (f.collaterals as string[]) ?? [],
            debt: (f.debt as string) ?? "0",
            tvl: (f.tvl as string) ?? "0",
            healthFactor: (f.healthFactor as string) ?? "0",
            owner: (f.vaultOwner ?? f.owner) as string ?? "",
            vaultName: (f.name ?? f.vaultName) as string ?? "",
            debtHuman: (f.debtHuman ?? f.debt) as string ?? "0",
            liquidationFactor: (f.liquidationFactor ?? f.healthFactor) as string ?? "0",
            liquidationThreshold: (f.liquidationThreshold as string) ?? "0",
            redemptionFactor: (f.redemptionFactor as string) ?? "1.3",
            redemptionThreshold: (f.redemptionThreshold as string) ?? "0",
            borrowable: (f.borrowable as string) ?? "0",
            collateralInfo: (f.collateralInfo as VaultInfo["collateralInfo"]) ?? [],
          })
        } else {
          setVault(undefined)
        }
        setIsLoading(false)
      })
      .catch(() => {
        setVault(undefined)
        setIsLoading(false)
      })
  }, [apiUrl, address])

  const refetch = useCallback((silent = false) => {
    const addr = address?.trim()
    if (!addr || addr.length < 10) {
      setVault(undefined)
      setIsLoading(false)
      return
    }
    if (!silent) setIsLoading(true)
    fetch(`${apiUrl}/vaults/${addr}`)
      .then(async (res) => {
        const data = await res.json().catch(() => null)
        if (res.ok && data && !("error" in data)) {
          setVault(data)
          setIsLoading(false)
          return
        }
        tryOverviewFallback()
      })
      .catch(() => tryOverviewFallback())
  }, [apiUrl, address, tryOverviewFallback])

  useEffect(() => {
    refetch()
  }, [refetch])

  useEffect(() => {
    if (refetchInterval <= 0) return
    const interval = setInterval(() => refetch(true), refetchInterval)
    return () => clearInterval(interval)
  }, [refetchInterval, refetch])

  return { vault, isLoading, refetch }
}
