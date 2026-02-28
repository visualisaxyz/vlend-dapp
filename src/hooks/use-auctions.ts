"use client"

import { useEffect, useState } from "react"

export type Auction = {
  id: string
  collateral: number
  collateralUSD: number
  debt: number
  timeLeft: number
  startPrice: number
  floorPrice: number
}

const MOCK_AUCTIONS: Auction[] = [
  {
    id: "A-0041",
    collateral: 1.2,
    collateralUSD: 3720,
    debt: 2800,
    timeLeft: 4823,
    startPrice: 2800,
    floorPrice: 3534,
  },
  {
    id: "A-0040",
    collateral: 0.55,
    collateralUSD: 1705,
    debt: 1100,
    timeLeft: 1247,
    startPrice: 1100,
    floorPrice: 1620,
  },
]

export default function useAuctions() {
  const [auctions, setAuctions] = useState<Auction[]>(MOCK_AUCTIONS)

  useEffect(() => {
    const t = setInterval(() => {
      setAuctions((a) =>
        a.map((x) => ({ ...x, timeLeft: Math.max(0, x.timeLeft - 1) }))
      )
    }, 1000)
    return () => clearInterval(t)
  }, [])

  return { auctions, isLoading: false }
}
