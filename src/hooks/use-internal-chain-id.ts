import { useChainId } from "wagmi"

import { AllowedChainIds } from "@/config/blockchain"

export default function useInternalChainId() {
  const chainId = useChainId()
  return chainId && chainId === AllowedChainIds.MegaETH ? chainId : AllowedChainIds.MegaETH
}
