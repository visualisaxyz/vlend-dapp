"use client";

import { useEffect, useState } from "react";
import useApiUrl from "./use-api-url";
import useInternalChainId from "./use-internal-chain-id";
import useAbi from "./use-abi";
import { UseReadContractReturnType, useAccount, useBalance, useReadContract, useReadContracts } from "wagmi";
import { erc20Abi } from "viem";
import { nativeWrappedTokens } from "@/config/blockchain";

export default function useIsCenturion(customAddress: `0x${string}` = "0x") {

    const { address } = useAccount();
    const centurinProgramAbi = useAbi("CenturionProgram");

    const results = useReadContracts({
        contracts: [
            {
                abi: centurinProgramAbi?.abi,
                address: centurinProgramAbi?.address,
                functionName: "balanceOf",
                args: [(customAddress !== "0x") ? customAddress : (address ?? "0x")],
                chainId: 137,
            },
        ],
        query: {
            refetchInterval: 5000,
            refetchIntervalInBackground: true,
        }
    });

    const balanceOf = results.data?.[0].result as bigint;

    const isCenturion = balanceOf > 0;

    return {
        isCenturion,
        isLoading: results.isLoading,
    }
}