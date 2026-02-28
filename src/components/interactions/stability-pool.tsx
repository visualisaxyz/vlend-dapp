import { useEffect, useState } from "react"
import Link from "next/link"
import { formatEther } from "viem"
import { useAccount, useWriteContract } from "wagmi"

import useAbi from "@/hooks/use-abi"
import useInternalChainId from "@/hooks/use-internal-chain-id"
import useStabilityPool from "@/hooks/use-stability-pool"
import useStabilityPoolRealTime from "@/hooks/use-stability-pool-realtime"

import Apr from "../ui/apr"
import FloatToPrettyNumber from "../ui/floatToPrettyNumber"
import GradientSeparator from "../ui/gradient-separator"
import TransactionDialog from "../ui/interactions/transaction-dialog"
import StatisticsCard from "../ui/statistics-card"
import StyledButton from "../ui/styled-button"
import TokenIcon from "../ui/token-icon"
import StabilityPoolStake from "./stability-pool-stake"

export default function StabilityPool() {
  const data = useStabilityPool()
  const { isLoading, stake, rewards } = useStabilityPoolRealTime()
  const { data: hash, writeContract, isPending } = useWriteContract()
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined)
  const stabilityPoolAbi = useAbi("StabilityPool")
  const { address } = useAccount()
  const chainId = useInternalChainId()
  useEffect(() => {
    if (hash !== undefined) {
      setTxHash(hash)
    }
  }, [hash])

  return (
    <div className="flex w-full flex-col items-center justify-between md:flex-row md:items-start md:space-x-2 lg:space-x-4">
      <div className="absolute left-0 top-[5.75rem] flex w-full flex-col items-center justify-center gap-6 py-1 text-center">
        <div
          className="flex items-center justify-center
					rounded-xl border-[0.5px] border-primary border-opacity-20 bg-opacity-20 px-2 py-[4px] backdrop-blur-sm"
        >
          <Link
            href={"/staking/wtao"}
            className="rounded-lg p-2 text-primary opacity-80"
          >
            Stake WTAO
          </Link>
          <a
            href="https://app.trustedstake.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg p-2 text-primary opacity-80"
          >
            Stake TAO
          </a>
        </div>
      </div>
      <StabilityPoolStake />
      <div className="flex w-full flex-col items-center justify-start gap-4 pt-4 text-base md:w-1/2 md:pt-0">
        <StatisticsCard className="w-full">
          <div className="flex w-full flex-row items-center justify-between py-1">
            <div className="flex flex-col items-start">
              <div className="text-xl text-primary">Statistics</div>
              <div className="text-pretty text-xs text-primary opacity-60">
                Track your stats in easiest way
              </div>
            </div>

            <div className="flex flex-col items-start justify-between text-primary">
              <div className="text-sm opacity-60">Est. APR</div>
              <div>{data.stabilityPoolOverview?.APR ?? "0.00"}%</div>
            </div>
          </div>
        </StatisticsCard>
        <StatisticsCard title="" className="w-full">
          <div className="mt-4 flex flex-wrap items-center justify-between space-x-4 text-base text-primary">
            <div>Total vUSD Staked</div>
            <div className="flex space-x-4">
              <div>
                <FloatToPrettyNumber>
                  {data.stabilityPoolOverview?.totalVusdStakedHuman}
                </FloatToPrettyNumber>
              </div>
              <div>
                <TokenIcon symbol="vUSD" />
              </div>
            </div>
          </div>
          <GradientSeparator className="mt-4" />
          <div className="mt-4 flex flex-wrap items-center justify-between space-x-4 text-base text-primary">
            <div>Total VLEND Rewards</div>
            <div className="flex space-x-4">
              <div>
                <FloatToPrettyNumber>
                  {data.stabilityPoolOverview?.totalVLENDRewardsHuman}
                </FloatToPrettyNumber>
              </div>
              <div>
                <TokenIcon symbol="VLEND" />
              </div>
            </div>
          </div>
          <GradientSeparator className="mt-4" />
          <div className="mt-4 flex flex-wrap items-center justify-between space-x-4 text-base font-semibold text-primary">
            Your Position
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between pb-2 text-base text-primary md:space-x-4">
            <div className="flex space-x-2">
              <div className="text-muted-foreground">Staked vUSD:</div>
              <div>
                <FloatToPrettyNumber>
                  {formatEther(stake ?? BigInt(0))}
                </FloatToPrettyNumber>
              </div>
              <div>
                <TokenIcon symbol="vUSD" />
              </div>
            </div>
            <div className="flex space-x-2">
              <div className="text-muted-foreground">Rewards:</div>
              <div>
                <FloatToPrettyNumber>
                  {formatEther(rewards ?? BigInt(0))}
                </FloatToPrettyNumber>
              </div>
              <div>
                <TokenIcon symbol="VLEND" />
              </div>
            </div>
            <div className="flex space-x-4 text-sm">
              <StyledButton
                isLoading={isPending === true}
                className="flex flex-1 font-semibold"
                disabled={txHash !== undefined || rewards === BigInt(0)}
                onClick={() => {
                  if (stabilityPoolAbi.abi && stabilityPoolAbi.address) {
                    writeContract({
                      abi: stabilityPoolAbi.abi,
                      address: stabilityPoolAbi.address,
                      chainId: chainId,
                      functionName: "redeemReward",
                    })
                  }
                }}
              >
                <div className="flex items-center space-x-2">
                  <div>
                    <TokenIcon symbol="VLEND" invert={true} />
                  </div>
                  <div>Harvest</div>
                </div>
              </StyledButton>

              {txHash && (
                <TransactionDialog
                  open={true}
                  hash={txHash}
                  onOpenChange={() => {
                    setTxHash(undefined)
                  }}
                />
              )}
            </div>
          </div>
        </StatisticsCard>
      </div>
    </div>
  )
}
