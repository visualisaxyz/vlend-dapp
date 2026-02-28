import { JetBrains_Mono } from "next/font/google"

import { cn } from "@/lib/utils"

import Spinner from "./spinner"

const jetbrains = JetBrains_Mono({ subsets: ["latin"] })

export default function TxInfo({
  title,
  description,
  className,
  txHash,
}: {
  className?: string
  title?: string
  description?: string
  txHash?: string
}) {
  return (
    <div className="dialog-container z-50 min-w-64 cursor-pointer rounded-md text-left text-base">
      <div className="bg-color_2 rounded-md leading-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="tracking-tight">{title}</h2>
            <p className="text-muted-foreground">{description}</p>
            <div className="mt-2 flex text-right text-xs">
              {txHash && (
                <a
                  href={`https://etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className="text-color_3">View on Etherscan</div>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
