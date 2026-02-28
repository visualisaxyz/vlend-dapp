"use client"

import { formatEther } from "viem"

type FormatBorrowRateProps = {
  children?: bigint | undefined
}

export default function FormatBorrowRate({ children }: FormatBorrowRateProps) {
  if (children) {
    const ratePercent = children as bigint
    const rate = parseFloat(formatEther(ratePercent * BigInt(100))).toFixed(2)
    return <>{rate}%</>
  }

  return null
}
