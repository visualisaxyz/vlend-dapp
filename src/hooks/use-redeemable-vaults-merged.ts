"use client"

import { parseUnits } from "viem"
import { useAccount } from "wagmi"

import useCollaterals from "./use-collaterals"
import useRedeemableVaults, {
  type RedeemableVault as ApiRedeemableVault,
} from "./use-redeemable-vaults"
import useStatistics from "./use-statistics"
import useVaultsList, { type VaultList } from "./use-vaults-list"
import { shortAddress } from "@/lib/utils"

export type RedeemableVaultMerged = {
  id: string
  address: string
  owner: string
  collateral: number
  collateralUSD: number
  debtVUSD: number
  healthFactor: number
  collateralRatio: number
  isOwn: boolean
  collateralToken: string
  collateralTokenSymbol: string
  maxReedemable: string
  maxReedemableHuman: string
}

function mapApiVault(
  v: ApiRedeemableVault,
  address: string | undefined
): RedeemableVaultMerged {
  const collateralValue = parseFloat(v.collateralValueHuman || "0")
  const debt = parseFloat(v.debtHuman || "0")
  const collateralRatio = debt > 0 ? (collateralValue / debt) * 100 : 0
  const mcr = 1.1
  const healthFactor = debt > 0 ? (collateralValue / debt) / mcr : 999

  return {
    id: shortAddress(v.address),
    address: v.address,
    owner: v.owner,
    collateral: parseFloat(v.collateralAmountHuman || "0"),
    collateralUSD: collateralValue,
    debtVUSD: debt,
    healthFactor,
    collateralRatio,
    isOwn: !!address && v.owner.toLowerCase() === address.toLowerCase(),
    collateralToken: v.collateralToken,
    collateralTokenSymbol: v.collateralTokenSymbol || "WETH",
    maxReedemable: v.maxReedemable,
    maxReedemableHuman: v.maxReedemableHuman || "0",
  }
}

function mapVaultList(
  v: VaultList,
  address: string | undefined,
  wethPrice: number
): RedeemableVaultMerged {
  const tvl = parseFloat(v.tvl || "0")
  const debt = parseFloat(v.debtHuman || "0")
  const collateral = wethPrice > 0 ? tvl / wethPrice : 0
  const collateralRatio = debt > 0 ? (tvl / debt) * 100 : 0
  const healthFactor = parseFloat(v.healthFactor || "1")
  const collateralToken =
    v.collaterals?.[0] ||
    "0x4200000000000000000000000000000000000006"
  const maxReedemableHuman =
    debt > 0 && wethPrice > 0
      ? (Math.min(debt, tvl) / wethPrice).toFixed(4)
      : "0"
  const maxReedemable =
    debt > 0 && wethPrice > 0
      ? parseUnits(
          (Math.min(debt, tvl) / wethPrice).toFixed(18),
          18
        ).toString()
      : "0"

  return {
    id: shortAddress(v.address),
    address: v.address,
    owner: v.vaultOwner,
    collateral,
    collateralUSD: tvl,
    debtVUSD: debt,
    healthFactor,
    collateralRatio,
    isOwn: !!address && v.vaultOwner?.toLowerCase() === address.toLowerCase(),
    collateralToken,
    collateralTokenSymbol: "WETH",
    maxReedemable,
    maxReedemableHuman,
  }
}

export default function useRedeemableVaultsMerged() {
  const { address } = useAccount()
  const { redeemableVaults, isLoading: apiLoading } = useRedeemableVaults()
  const { vaults, isLoading: vaultsLoading } = useVaultsList()
  const { statistics, isLoading: statsLoading } = useStatistics()
  const { collaterals } = useCollaterals()

  const wethCollateral = collaterals?.find(
    (c) =>
      c.tokenName?.toUpperCase() === "WETH" ||
      c.address?.toLowerCase() ===
        "0x4200000000000000000000000000000000000006"
  )
  const wethPrice = parseFloat(wethCollateral?.price ?? "3100")
  const redemptionLimit = parseFloat(
    statistics?.healthFactor?.redemptionLimit ?? "1.5"
  )

  const isLoading = apiLoading || vaultsLoading || statsLoading

  const vaultsFromApi =
    Array.isArray(redeemableVaults) && redeemableVaults.length > 0
      ? redeemableVaults.map((v) => mapApiVault(v, address))
      : []

  const vaultsFromList =
    vaultsFromApi.length === 0
      ? vaults
          .filter(
            (v: VaultList) =>
              parseFloat(v.healthFactor || "1") < redemptionLimit
          )
          .map((v: VaultList) => mapVaultList(v, address, wethPrice))
      : []

  const redeemableVaultsMerged =
    vaultsFromApi.length > 0 ? vaultsFromApi : vaultsFromList

  return {
    redeemableVaults: redeemableVaultsMerged as RedeemableVaultMerged[],
    isLoading,
  }
}
