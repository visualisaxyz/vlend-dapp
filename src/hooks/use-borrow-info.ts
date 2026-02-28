"use client"

import { createElement, useEffect, useState } from "react"
import { formatEther, formatUnits, parseEther, parseUnits } from "viem"
import { useChainId } from "wagmi"

import { apiUrls } from "@/config/blockchain"
import TokenIcon from "@/components/ui/token-icon"

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
}

export default function useBorrowInfo(
  collateral: `0x${string}` | undefined,
  collaterals: Collateral[] | undefined,
  collateralBalance: string | undefined,
  borrowAmount: string | undefined
) {
  const foundCollateral = collaterals?.find(
    (value) => value.address.toLowerCase() === collateral?.toLowerCase()
  )
  let maxBorrow = BigInt(0)
  let stableValue = BigInt(0)
  let mcr = BigInt(0)
  let mlr = BigInt(0)
  let fee = BigInt(0)
  let feePercentage = BigInt(0)
  let netReceived = BigInt(0)
  let healthFactor = parseEther("100")

  const borrowAmountBn = parseEther(borrowAmount ?? "0")

  // console.log("useBorrowInfo debug:", {
  //   foundCollateral: foundCollateral
  //     ? {
  //         address: foundCollateral.address,
  //         tokenName: foundCollateral.tokenName,
  //         mcr: foundCollateral.mcr,
  //         mlr: foundCollateral.mlr,
  //         price: foundCollateral.price,
  //         borrowRate: foundCollateral.borrowRate,
  //       }
  //     : undefined,
  //   collateral,
  //   collateralBalance,
  //   price: foundCollateral?.price,
  //   mcr: foundCollateral?.mcr,
  // })

  if (foundCollateral && foundCollateral.price) {
    if (collateralBalance) {
      const decimalPrecision = parseEther("1")
      mcr = (decimalPrecision * BigInt(foundCollateral.mcr)) / BigInt(100)
      mlr = (decimalPrecision * BigInt(foundCollateral.mlr)) / BigInt(100)
      stableValue =
        (parseUnits(foundCollateral.price, 18) *
          parseEther(collateralBalance)) /
        decimalPrecision
      maxBorrow = (stableValue * decimalPrecision) / mcr
      if (foundCollateral.borrowRate) {
        feePercentage = parseEther(foundCollateral.borrowRate.toString())
      }

      fee = (borrowAmountBn * feePercentage) / decimalPrecision
      feePercentage = feePercentage * BigInt(100)
      netReceived = borrowAmountBn - fee
      if (borrowAmountBn > BigInt(0)) {
        const mlrPercentage = (decimalPrecision * decimalPrecision) / mlr
        healthFactor = (stableValue * mlrPercentage) / borrowAmountBn
      }
    }
  }

  return {
    maxBorrow,
    maxBorrowHuman: formatEther(maxBorrow),
    stableValue,
    stableValueHuman: formatEther(stableValue),
    mcr,
    mcrHuman: formatEther(mcr),
    fee,
    feeHuman: formatEther(fee),
    netReceived,
    netReceivedHuman: formatEther(netReceived),
    healthFactor,
    healthFactorHuman: formatEther(healthFactor),
    feePercentage,
    feePercentageHuman: formatEther(feePercentage),
  }
}
