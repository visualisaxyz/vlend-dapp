import {
  useTransaction,
  useTransactionConfirmations,
  useTransactionReceipt,
  useWaitForTransactionReceipt,
} from "wagmi"

import useInternalChainId from "@/hooks/use-internal-chain-id"

export type TransactionStatus = "pending" | "success" | "error"

export default function TransactionWrapper({
  txHash,
  status,
  children,
}: {
  txHash: `0x${string}` | undefined
  status?: TransactionStatus | undefined
  children: React.ReactNode
}) {
  const chainId = useInternalChainId()
  const result = useWaitForTransactionReceipt({
    hash: txHash,
    chainId: chainId,
    confirmations: 1,
  })

  /* default behavior */
  if (!txHash && status == undefined) {
    return <>{children}</>
  }

  /* when status matches one of the available statuses */
  if (result.status == status && txHash) {
    return <>{children}</>
  }

  return null
}
