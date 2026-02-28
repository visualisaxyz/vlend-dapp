import {
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi"

export function useContract(address: string, abi: Array<any>) {
  if (!address.startsWith("0x")) {
    address = "0x" + address
  }

  const useReadFromContract = (functionName: string, args: Array<any>) => {
    const { data } = useReadContract({
      address: address as "0x${string}",
      abi,
      functionName,
      args,
    })
    return data
  }

  const { writeContract, isPending, data: hash } = useWriteContract()

  const writeToContract = (functionName: string, args: Array<any>) => {
    writeContract({
      address: address as "0x${string}",
      abi,
      functionName,
      args,
    })

    return { isPending, hash }
  }

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    })

  return {
    useReadFromContract,
    writeToContract,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
  }
}
