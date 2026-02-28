import type { VaultList } from "@/hooks/use-vaults-list"
import type { VaultCardData } from "@/components/ui/vault-card"
import { shortAddress } from "./utils"

export function mapVaultListToCard(
  v: VaultList,
  redemptionLimit: number,
  wethPrice: number
): VaultCardData {
  const collateralUSD = parseFloat(v.tvl || "0")
  const debtVUSD = parseFloat(v.debtHuman || "0")
  const rawHf = parseFloat(v.healthFactor || "1")
  const healthFactor = isNaN(rawHf) ? 999 : rawHf
  const collateralRatio =
    debtVUSD > 0 ? (collateralUSD / debtVUSD) * 100 : Infinity
  const collateral = wethPrice > 0 ? collateralUSD / wethPrice : 0

  return {
    id: shortAddress(v.address),
    address: v.address,
    collateral,
    collateralUSD,
    debtVUSD,
    healthFactor,
    collateralRatio,
    status: healthFactor < redemptionLimit ? "warning" : "safe",
  }
}
