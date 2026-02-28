import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import { explorerUrls } from "@/config/blockchain"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function txHashLink(chainId: any, hash: string) {
  const baseUrl =
    explorerUrls[chainId as keyof typeof explorerUrls] ?? explorerUrls[1]

  return `${baseUrl}${hash}`
}
