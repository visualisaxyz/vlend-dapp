"use client"

import { useEffect, useMemo, useState } from "react"
import type { Abi } from "viem"
import { formatEther } from "viem"
import { useReadContract, useReadContracts } from "wagmi"

import { vlendAddresses } from "@/config/blockchain"

import useAbi from "./use-abi"
import useCollaterals from "./use-collaterals"
import useInternalChainId from "./use-internal-chain-id"

const AUCTION_DURATION = 7200 // 2 hours in seconds

export type LiveAuction = {
  id: string
  auctionId: number
  vaultId: string
  collateral: number
  collateralUSD: number
  debtVUSD: number
  startPrice: number
  floorPrice: number
  currentPrice: number
  timeLeft: number
}

type AuctionInfoResult = {
  originalDebt: bigint
  lowestDebtToAuction: bigint
  highestDebtToAuction: bigint
  collateralsLength: bigint
  collateral: readonly `0x${string}`[]
  collateralAmount: readonly bigint[]
  auctionStartTime: bigint
  auctionEndTime: bigint
  auctionEnded: boolean
}

export default function useAuctionsLive() {
  const chainId = useInternalChainId()
  const auctionManagerAbi = useAbi("AuctionManager")
  const { collaterals } = useCollaterals()

  const auctionManagerAddress = vlendAddresses.auctionManager as `0x${string}`

  const wethAddress =
    "0x4200000000000000000000000000000000000006".toLowerCase()
  const wethCollateral = collaterals?.find(
    (c) =>
      c.tokenName?.toUpperCase() === "WETH" ||
      c.address?.toLowerCase() === wethAddress
  )
  const wethPrice = parseFloat(wethCollateral?.price ?? "3100")

  const { data: lengthData } = useReadContract({
    abi: auctionManagerAbi?.abi,
    address: auctionManagerAddress,
    chainId,
    functionName: "auctionsLength",
  })

  const { data: durationData } = useReadContract({
    abi: auctionManagerAbi?.abi,
    address: auctionManagerAddress,
    chainId,
    functionName: "auctionDuration",
  })

  const length = lengthData !== undefined ? Number(lengthData) : 0
  const duration = durationData !== undefined ? Number(durationData) : AUCTION_DURATION

  const indices = useMemo(() => {
    if (length === 0) return []
    const start = Math.max(0, length - 20)
    return Array.from({ length: length - start }, (_, i) => start + i)
  }, [length])

  const auctionContracts = useMemo(() => {
    if (!auctionManagerAbi?.abi || indices.length === 0) return []
    const abi = auctionManagerAbi.abi as Abi
    return indices.flatMap((i) => [
      {
        abi,
        address: auctionManagerAddress,
        functionName: "auctionInfo" as const,
        args: [BigInt(i)] as const,
        chainId,
      },
      {
        abi,
        address: auctionManagerAddress,
        functionName: "bidInfo" as const,
        args: [BigInt(i)] as const,
        chainId,
      },
    ])
  }, [auctionManagerAbi?.abi, auctionManagerAddress, chainId, indices])

  const results = useReadContracts({
    contracts: auctionContracts,
    query: {
      refetchInterval: 5000,
      refetchIntervalInBackground: true,
      enabled:
        !!auctionManagerAbi?.abi &&
        auctionContracts.length > 0 &&
        indices.length > 0,
    },
  })

  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000))

  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000)
    return () => clearInterval(t)
  }, [])

  const auctions = useMemo(() => {
    if (!results.data || results.data.length === 0) return []

    const live: LiveAuction[] = []

    for (let j = 0; j < indices.length; j++) {
      const infoResult = results.data[j * 2]?.result as
        | AuctionInfoResult
        | undefined
      const bidResult = results.data[j * 2 + 1]?.result as
        | [bigint, bigint]
        | undefined

      if (!infoResult || !bidResult) continue

      const [totalCollateralValue, debtToAuctionAtCurrentTime] = bidResult

      if (infoResult.auctionEnded) continue

      const endTime = Number(infoResult.auctionEndTime)
      const timeLeft = Math.max(0, endTime - now)
      if (timeLeft <= 0) continue

      const collateralUSD = Number(formatEther(totalCollateralValue))
      const collateral = wethPrice > 0 ? collateralUSD / wethPrice : 0
      const debtVUSD = Number(formatEther(infoResult.originalDebt))
      const startPrice = Number(formatEther(infoResult.highestDebtToAuction))
      const floorPrice = Number(formatEther(infoResult.lowestDebtToAuction))
      const currentPrice = Number(formatEther(debtToAuctionAtCurrentTime))

      live.push({
        id: `A-${String(indices[j]).padStart(4, "0")}`,
        auctionId: indices[j],
        vaultId: String(indices[j]),
        collateral,
        collateralUSD,
        debtVUSD,
        startPrice,
        floorPrice,
        currentPrice,
        timeLeft,
      })
    }

    return live.sort((a, b) => a.timeLeft - b.timeLeft)
  }, [results.data, indices, now, wethPrice])

  return {
    auctions,
    auctionDuration: duration,
    isLoading:
      auctionManagerAbi?.isLoading ||
      results.isLoading ||
      (length > 0 && results.data === undefined),
  }
}
