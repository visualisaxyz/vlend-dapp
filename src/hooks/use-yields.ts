import { useQuery } from "@tanstack/react-query"

import useApiUrl from "./use-api-url"

export default function useYields() {
  const apiUrl = useApiUrl()

  const { data: yields, isLoading } = useQuery({
    queryKey: ["yields", apiUrl],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/yields/overview`)
      const data = await res.json()
      const yieldsKeys = Object.keys(data ?? {})
      let formattedYields: unknown[] = []
      for (const key of yieldsKeys) {
        formattedYields = [
          ...formattedYields,
          ...(data[key as keyof object] ?? []),
        ]
      }
      return formattedYields
    },
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
  })

  return {
    yields: yields ?? [],
    isLoading,
  }
}
