"use client"

export type RedemptionHistoryItem = {
  id: string
  vaultId: string
  collateral: number
  collateralUSD: number
  vUSDburned: number
  redeemedBy: string
  resolvedAt: string
  type: "self" | "external"
}

export default function useRedemptionHistory() {
  return {
    redemptionHistory: [] as RedemptionHistoryItem[],
    isLoading: false,
  }
}
