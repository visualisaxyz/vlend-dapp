"use client"

export type AuctionHistoryItem = {
  id: string
  vaultId: string
  collateral: number
  collateralUSD: number
  debtVUSD: number
  finalPriceVUSD: number | null
  winner: string
  resolvedAt: string
  path: "auction" | "stability" | "lastresort"
  discountPct: number | null
}

export default function useAuctionHistory() {
  return {
    auctionHistory: [] as AuctionHistoryItem[],
    isLoading: false,
  }
}
