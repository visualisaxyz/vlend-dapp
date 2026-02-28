"use client"

import { Fragment, useState } from "react"

import { SearchBar } from "../search-bar"
import FloatToCurrency from "../ui/floatToCurrency"
import FloatToPrettyNumber from "../ui/floatToPrettyNumber"
import TokenIcon from "../ui/token-icon"

type CollateralData = {
  tokenName: string
  address: string
  mcr: number
  mlr: number
  decimals: number
  oracle: string
  oracleType: string
  borrowRate: number
  cap: number
  capUsage: number
  capUsagePercentage: string
  price: string
  capInUsd: number
  capUsageInUsd: number
}

export default function CollateralStatistics({
  collateralData,
}: {
  collateralData: CollateralData[]
}) {
  const [searchValue, setSearchValue] = useState("")

  const filteredCollateralData = collateralData.filter((collateral) => {
    if (searchValue.trim() === "") {
      return true
    }
    return collateral.tokenName
      .toLowerCase()
      .includes(searchValue.toLowerCase().trim())
  })

  return (
    <div className="flex flex-col space-y-4 pb-2 text-sm">
      <div className="w-full">
        <div className="z-20 mt-3 hidden max-h-[300px] grid-cols-8 items-center gap-4 overflow-y-auto text-pretty text-xs md:grid">
          <div className="absolute z-10 h-[2.5rem] w-[97%] translate-x-[-0.9rem] translate-y-[-4.2rem] bg-[#BAF7E9] opacity-5" />

          <div className="z-30 font-semibold opacity-60">Collateral</div>
          <div className="z-30 font-semibold opacity-60">
            Deposited Tokens
            <br />
            <span className="z-30 text-muted-foreground opacity-60">
              (n. of tokens)
            </span>
          </div>
          <div className="z-30 font-semibold opacity-60">
            Deposited Tokens
            <br />
            <span className="z-30 text-muted-foreground opacity-60">
              ($ value)
            </span>
          </div>
          <div className="z-30 font-semibold opacity-60">
            Collateralization Ratio
          </div>
          <div className="z-30 font-semibold opacity-60">Liquidation Ratio</div>
          <div className="z-30 font-semibold opacity-60">
            Borrowing Capacity
            <br />
            <span className="z-30 text-muted-foreground opacity-60">
              (tokens)
            </span>
          </div>
          <div className="z-30 font-semibold opacity-60">
            <span className="z-30 text-muted-foreground opacity-60">
              (used)
            </span>
          </div>
          <div className="z-30 font-semibold opacity-60">Borrowing Fee</div>

          {filteredCollateralData.map((collateral, index) => (
            <Fragment key={index}>
              <div>
                <div className="flex items-center space-x-2">
                  <TokenIcon symbol={collateral.tokenName} />
                  <span>{collateral.tokenName}</span>
                </div>
              </div>
              <div>
                {collateral.capUsage === 0 ? (
                  0
                ) : (
                  <FloatToPrettyNumber style="decimal">
                    {collateral.capUsage}
                  </FloatToPrettyNumber>
                )}
              </div>
              <div>
                {collateral.capUsageInUsd === 0 ? (
                  0
                ) : (
                  <FloatToCurrency>{collateral.capUsageInUsd}</FloatToCurrency>
                )}
              </div>
              <div>{collateral.mcr}%</div>
              <div>{collateral.mlr}%</div>
              <div>
                {" "}
                <FloatToPrettyNumber style="decimal">
                  {collateral.cap}
                </FloatToPrettyNumber>
              </div>
              <div>
                {collateral.capInUsd === 0 ? (
                  0
                ) : (
                  <>
                    <FloatToPrettyNumber>
                      {collateral.capUsagePercentage}
                    </FloatToPrettyNumber>
                    %
                  </>
                )}
              </div>
              <div>{collateral.borrowRate * 100}%</div>
            </Fragment>
          ))}
        </div>

        <div className="mt-6 md:hidden">
          {filteredCollateralData.map((collateral, index) => (
            <Fragment key={index}>
              <div className="mt-2 grid grid-cols-2 items-center gap-4 text-pretty border-b p-4 text-xs">
                <div>
                  <div className="flex items-center space-x-2">
                    <TokenIcon symbol={collateral.tokenName} />
                    <span>{collateral.tokenName}</span>
                  </div>
                </div>
                <div></div>
                <div>
                  <div className="font-semibold">
                    Deposited Tokens
                    <br />
                    <span className="text-muted-foreground">
                      (n. of tokens)
                    </span>
                  </div>
                  <div>
                    {collateral.capUsage === 0 ? (
                      0
                    ) : (
                      <FloatToPrettyNumber style="decimal">
                        {collateral.capUsage}
                      </FloatToPrettyNumber>
                    )}
                  </div>
                </div>
                <div>
                  <div className="font-semibold">
                    Deposited Tokens
                    <br />
                    <span className="text-muted-foreground">($ value)</span>
                  </div>
                  <div>
                    {collateral.capUsageInUsd === 0 ? (
                      0
                    ) : (
                      <FloatToCurrency>
                        {collateral.capUsageInUsd}
                      </FloatToCurrency>
                    )}
                  </div>
                </div>
                <div>
                  <div className="font-semibold">Collateralization Ratio</div>
                  <div>{collateral.mcr}%</div>
                </div>
                <div>
                  <div className="font-semibold">Liquidation Ratio</div>
                  <div>{collateral.mlr}%</div>
                </div>
                <div>
                  <div className="font-semibold">
                    Borrowing Capacity
                    <br />
                    <span className="text-muted-foreground">(tokens)</span>
                  </div>
                  <div>
                    <FloatToPrettyNumber style="decimal">
                      {collateral.cap}
                    </FloatToPrettyNumber>
                  </div>
                </div>
                <div>
                  <div className="font-semibold">
                    Borrowing Capacity
                    <br />
                    <span className="text-muted-foreground">(used)</span>
                  </div>
                  <div>
                    {collateral.capInUsd === 0 ? (
                      0
                    ) : (
                      <>
                        <FloatToPrettyNumber>
                          {collateral.capUsagePercentage}
                        </FloatToPrettyNumber>
                        %
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <div className="font-semibold">Borrowing Fee</div>
                  <div>{collateral.borrowRate * 100}%</div>
                </div>
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
