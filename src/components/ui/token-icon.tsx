"use client"

import Image, { StaticImageData } from "next/image"
import DAI from "@/assets/icons/dai.svg"
import WETH from "@/assets/icons/eth.svg"
import USDC from "@/assets/icons/usdc.svg"
import USDT from "@/assets/icons/usdt.svg"

type TokenIconProps = {
  symbol: string | undefined
  width?: number
  height?: number
  invert?: boolean
}

export default function TokenIcon({
  symbol,
  width = 24,
  height = 24,
  invert = false,
}: TokenIconProps) {
  const icons: { [key: string]: string | StaticImageData } = {
    vUSD: USDC,
    VLEND: USDC,
    WETH: WETH,
    ETH: WETH,
    USDC: USDC,
    USDT: USDT,
    DAI: DAI,
  }

  if (!symbol) {
    return null
  }

  if (icons[symbol]) {
    return (
      <Image
        src={icons[symbol]}
        alt={symbol}
        width={width}
        height={height}
        className={`${invert === true ? "invert" : ""}`}
      />
    )
  }

  return null
}
