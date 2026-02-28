"use client"

import React, { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createWeb3Modal } from "@web3modal/wagmi/react"
import { State, WagmiProvider } from "wagmi"

import { config, projectId } from "@/config/blockchain"

// Setup queryClient with caching defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      gcTime: 5 * 60 * 1000,
    },
  },
})

if (!projectId) throw new Error("Project ID is not defined")

// Create modal
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: false,
  themeVariables: {
    "--w3m-color-mix": "#10b981",
    "--w3m-accent": "#10b981",
    "--w3m-border-radius-master": "6px",
    "--w3m-font-family": "DM Sans, sans-serif",
    "--w3m-font-size-master": "8px",
  },
  themeMode: "dark",
})

export function ContextProvider({
  children,
  initialState,
}: {
  children: ReactNode
  initialState?: State
}) {
  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
