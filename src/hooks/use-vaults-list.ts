import { useQuery } from "@tanstack/react-query"

import useApiUrl from "./use-api-url"

export type VaultList = {
  address: string
  url: string
  debt: string
  debtHuman: string
  collaterals: string[]
  vaultOwner: string
  tvl: string
  version: string
  healthFactor: string
  liquidationFactor: string
  name: string
}

export default function useVaultsList() {
  const apiUrl = useApiUrl()

  const { data, isLoading } = useQuery({
    queryKey: ["vaults-list", apiUrl],
    queryFn: async () => {
      const [vaultsRes, tvlRes] = await Promise.all([
        fetch(`${apiUrl}/vaults/overview`).then((r) => r.json()),
        fetch(`${apiUrl}/tvl`).then((r) => r.json()),
      ])
      const vaults = vaultsRes ?? []
      const vaultTvl = vaults.reduce(
        (sum: number, vault: VaultList) => sum + (parseFloat(vault.tvl) || 0),
        0
      )
      const totalTvl =
        typeof tvlRes === "number"
          ? tvlRes
          : tvlRes?.tvl ?? tvlRes?.totalTvl ?? vaultTvl
      return { vaults, vaultsTvl: vaultTvl, totalTvl }
    },
    staleTime: 15_000,
    gcTime: 5 * 60 * 1000,
  })

  return {
    vaults: data?.vaults ?? [],
    vaultsTvl: data?.vaultsTvl ?? 0,
    vaultsTvl964: 0,
    totalTvl: data?.totalTvl ?? 0,
    isLoading,
  }
}
