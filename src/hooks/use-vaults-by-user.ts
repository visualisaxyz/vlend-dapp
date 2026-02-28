import { useEffect, useState } from "react"
import { Abi } from "viem"
import { useReadContracts, UseReadContractsReturnType } from "wagmi"

import useAbi from "./use-abi"
import useApiUrl from "./use-api-url"
import useInternalChainId from "./use-internal-chain-id"

export type VaultsByUserList = {
  address: `0x${string}` | undefined
  name: string | undefined
  debt: bigint | undefined
}

export type VaultsByUserApi = {
  address: `0x${string}`
  url: string
}

export default function useVaultsByUser(user: `0x${string}`) {
  const apiUrl = useApiUrl()
  const internalChainId = useInternalChainId()
  const vaultAbi = useAbi("Vault")

  const [apiVaults, setApiVaults] = useState<VaultsByUserApi[]>([])

  let vaults: VaultsByUserList[] | undefined

  useEffect(() => {
    if (user) {
      fetch(`${apiUrl}/vaultsByUser/${user}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`)
          }
          return res.json()
        })
        .then((data) => {
          if (Array.isArray(data)) {
            setApiVaults(data)
          } else {
            console.error("Expected an array but got:", data)
            setApiVaults([])
          }
        })
        .catch((error) => {
          console.error("Failed to fetch vaults:", error)
          setApiVaults([])
        })
    } else {
      setApiVaults([])
    }
  }, [apiUrl, user])

  const results = useReadContracts({
    contracts: apiVaults.map((vault) => ({
      abi: vaultAbi?.abi as Abi,
      address: vault.address,
      chainId: internalChainId as number,
      functionName: "name",
    })),
    query: {
      refetchInterval: 5000,
      enabled: apiVaults.length > 0 && !!vaultAbi?.abi,
    },
  })

  const resultsDebt = useReadContracts({
    contracts: apiVaults.map((vault) => ({
      abi: vaultAbi?.abi as Abi,
      address: vault.address,
      chainId: internalChainId as number,
      functionName: "debt",
    })),
    query: {
      refetchInterval: 5000,
      enabled: apiVaults.length > 0 && !!vaultAbi?.abi,
    },
  })

  if (
    results.data &&
    results.data.length > 0 &&
    resultsDebt.data &&
    resultsDebt.data.length > 0
  ) {
    vaults = results.data?.map((vault, index) => {
      return {
        address: apiVaults?.[index].address,
        name: vault?.result as string,
        debt: resultsDebt.data?.[index].result as bigint,
      }
    })
  }

  return { vaults: vaults, isLoading: !vaults }
}
