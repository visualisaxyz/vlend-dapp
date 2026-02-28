"use client"

import React from "react"
import { ExternalLink } from "lucide-react"
import { formatEther } from "viem"

import useStabilityPool from "@/hooks/use-stability-pool"
import useYields from "@/hooks/use-yields"
import FloatToCurrency from "@/components/ui/floatToCurrency"
import PageTopNav from "@/components/ui/page-top-nav"
import ProgressBar from "@/components/ui/progress-bar"
import StyledButton from "@/components/ui/styled-button"

export default function Yields() {
  const { yields, isLoading } = useYields()
  const { stabilityPoolOverview } = useStabilityPool()

  if (isLoading) {
    return (
      <div className="container mt-20 items-center p-10 text-center text-sm">
        <ProgressBar />
      </div>
    )
  }

  const filteredYields = (yields as { name?: string }[]).filter(
    (yieldItem) => yieldItem.name !== "ApeBond"
  )

  return (
    <>
      <PageTopNav>Yield opportunities</PageTopNav>
      <div className="container items-center p-10 text-center text-sm">
        <div className="hidden lg:block">
          <div className="grid grid-cols-5">
            <div className="rounded-tl-lg border-b border-l border-t bg-gray-800 p-3 font-semibold">
              Where
            </div>
            <div className="border-b border-t bg-gray-800 p-3 font-semibold">
              Pool
            </div>
            <div className="border-b border-t bg-gray-800 p-3 font-semibold">
              Deposit Token
            </div>
            <div className="border-b border-t bg-gray-800 p-3 font-semibold">
              Rewards
            </div>
            <div className="rounded-tr-lg border-b border-r border-t bg-gray-800 p-3 font-semibold">
              TVL
            </div>

            {!isLoading &&
              filteredYields.map((yieldItem: any, index: number) => {
                const isLast = index === filteredYields.length - 1
                const extraClassesLeft = isLast ? "rounded-bl-lg " : ""
                const extraClassesRight = isLast ? "rounded-br-lg " : ""
                const extraClassesBottom = isLast ? "border-b " : ""
                return (
                  <React.Fragment key={index}>
                    <div
                      className={`border-l p-3 ${extraClassesLeft} ${extraClassesBottom}`}
                    >
                      <div className="flex items-center justify-center">
                        <a
                          href={yieldItem.url}
                          title=""
                          className="text-lime-500 transition-all duration-200 hover:text-lime-700"
                        >
                          <ExternalLink />
                        </a>
                        <div className="flex-1">{yieldItem.name}</div>
                      </div>
                    </div>
                    <div className={`p-3 ${extraClassesBottom}`}>
                      {yieldItem.pool}
                    </div>
                    <div className={`p-3 ${extraClassesBottom}`}>
                      {yieldItem.depositToken}
                    </div>
                    <div className={`p-3 ${extraClassesBottom}`}>
                      {yieldItem.pool !== "Stability Pool" && (
                        <span className="font-bold text-primary">
                          {yieldItem.apr}%
                        </span>
                      )}
                      {yieldItem.pool === "Stability Pool" && (
                        <span className="font-bold text-primary">
                          {stabilityPoolOverview?.APR ?? "0"}%
                        </span>
                      )}
                    </div>
                    <div
                      className={`border-r p-3 ${extraClassesRight} ${extraClassesBottom}`}
                    >
                      <FloatToCurrency>{yieldItem.tvl}</FloatToCurrency>
                    </div>
                  </React.Fragment>
                )
              })}
          </div>
        </div>

        <div className="lg:hidden">
          {!isLoading &&
            filteredYields.map((yieldItem: any, index: number) => (
              <div
                key={index}
                className="from-primary/20 mb-10 rounded-lg bg-gradient-to-br p-5"
              >
                <div className="mb-5 font-bold">
                  <div className="flex items-center justify-center space-x-1">
                    <a
                      href={yieldItem.url}
                      title=""
                      className="text-lime-500 transition-all duration-200 hover:text-lime-700"
                    >
                      <ExternalLink />
                    </a>
                    <div>{yieldItem.name}</div>
                  </div>
                </div>
                <div>{yieldItem.depositToken}</div>
                <div className="mt-2 grid grid-cols-2">
                  <div className="font-bold">Rewards</div>
                  <div className="font-bold">TVL</div>
                  <div>
                    {yieldItem.pool !== "Stability Pool" ? (
                      <span className="font-bold text-primary">
                        {yieldItem.apr}%
                      </span>
                    ) : (
                      <span className="font-bold text-primary">
                        {stabilityPoolOverview?.APR ?? "0"}%
                      </span>
                    )}
                  </div>
                  <div>
                    <FloatToCurrency>{yieldItem.tvl}</FloatToCurrency>
                  </div>
                </div>
              </div>
            ))}
        </div>

        <div className="mt-10 text-center">
          <StyledButton link="/swap">Buy vUSD</StyledButton>

          <div className="mt-10 text-left text-xs">
            <div className="font-semibold">DISCLAIMER</div>
            <div className="mt-5">
              Users participating in farming should be aware that our service
              relies on external providers. Any issues related to the
              performance, security, or availability of the third-party solution
              are subject to the terms and conditions of the service provider.
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
