"use client";

import { useEffect, useState } from "react";
import useApiUrl from "./use-api-url";
import useInternalChainId from "./use-internal-chain-id";
import useAbi from "./use-abi";
import { UseReadContractReturnType, useAccount, useBalance, useReadContract, useReadContracts } from "wagmi";
import { erc20Abi } from "viem";
import { nativeWrappedTokens } from "@/config/blockchain";

export default function useTokenApproval(tokenAddress: `0x${string}` | undefined, destination: `0x${string}` | undefined, amount: bigint | undefined) {

    const { address } = useAccount();
    const chainId = useInternalChainId();

    const { refetch, data } = useReadContract({
        abi: erc20Abi,
        address: tokenAddress,
        functionName: "allowance",
        args: [address ?? "0x", destination ?? "0x"],
        chainId: chainId,
        query: {
            refetchIntervalInBackground: true,
            refetchInterval: 5000,
        }
    })

    const balanceResult = useReadContract({
        abi: erc20Abi,
        address: tokenAddress,
        functionName: "balanceOf",
        args: [address ?? "0x"],
        chainId: chainId,
        query: {
            refetchIntervalInBackground: true,
            refetchInterval: 5000,
        }
    })




    let isApproved = false;
    let hasEnoughBalance = false;
    let balance = BigInt(0)

    if (balanceResult && balanceResult.data) {
        balance = BigInt(balanceResult.data);
    }
    if (data && amount) {
        isApproved = data >= amount;
    }

    if (amount && balance >= amount) {
        hasEnoughBalance = true;
    }

    const allowance = data !== undefined ? BigInt(data) : undefined

    return {
        isApproved,
        hasEnoughBalance,
        balance,
        allowance,
        refetch
    }
}

