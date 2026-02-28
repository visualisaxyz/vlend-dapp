"use client";

import { useEffect, useState } from "react";
import useApiUrl from "./use-api-url";
import { Abi } from "viem";

export type ApiAbi = {
    address: `0x${string}`;
    abi: unknown[] | Abi;
};

export default function useAbi(abiName: string) {
    const apiUrl = useApiUrl();

    const [apiAbi, setApiAbi] = useState<ApiAbi | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        setError(null);
        fetch(`${apiUrl}/abi/${abiName}`)
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`Failed to load ABI: ${res.status} ${res.statusText}`);
                }
                return res.json();
            })
            .then((data) => {
                setApiAbi(data);
            })
            .catch((err) => {
                setError(err instanceof Error ? err : new Error(String(err)));
                setApiAbi(undefined);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [apiUrl, abiName]);

    return { ...apiAbi, isLoading, error };
}