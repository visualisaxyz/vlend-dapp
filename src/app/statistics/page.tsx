"use client"

import React from "react"
import usePrices from "@/hooks/use-prices"
import useStatistics from "@/hooks/use-statistics"
import useStabilityPool from "@/hooks/use-stability-pool"
import useVaultsList from "@/hooks/use-vaults-list"
import FloatToCurrency from "@/components/ui/floatToCurrency"
import PageTopNav from "@/components/ui/page-top-nav"
import ProgressBar from "@/components/ui/progress-bar"
import StatisticsCard from "@/components/ui/statistics-card"

export default function StatisticsPage() {
  const { statistics, isLoading } = useStatistics()
  const { stabilityPoolOverview } = useStabilityPool()
  const { vaultsTvl, totalTvl } = useVaultsList()
  const { prices } = usePrices()

  if (isLoading) {
    return (
      <div className="container mt-20 items-center p-10 text-center text-sm">
        <ProgressBar />
      </div>
    )
  }

  return (
    <>
      <PageTopNav>Statistics</PageTopNav>
      <div className="container items-center px-10 pb-10 pt-20 text-sm">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatisticsCard title="Total TVL" className="w-full">
            <FloatToCurrency>{totalTvl || vaultsTvl}</FloatToCurrency>
          </StatisticsCard>
          <StatisticsCard title="vUSD Price" className="w-full">
            <FloatToCurrency>{prices?.vUSD ?? 0}</FloatToCurrency>
          </StatisticsCard>
          <StatisticsCard title="vUSD Market Cap" className="w-full">
            <FloatToCurrency>
              {parseFloat(statistics?.circulatingVUSD ?? "0")}
            </FloatToCurrency>
          </StatisticsCard>
          <StatisticsCard title="Stability Pool TVL" className="w-full">
            <FloatToCurrency>
              {stabilityPoolOverview?.totalVusdStakedHuman ?? "0"}
            </FloatToCurrency>{" "}
            vUSD
          </StatisticsCard>
          <StatisticsCard title="Total Vaults" className="w-full">
            {statistics?.totalVaultsCreated ?? 0}
          </StatisticsCard>
          <StatisticsCard title="Protection Threshold" className="w-full">
            {statistics?.healthFactor?.redemptionLimit ?? "1.5"}
          </StatisticsCard>
        </div>
      </div>
    </>
  )
}
