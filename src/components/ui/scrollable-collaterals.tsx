import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Collateral } from "@/hooks/use-collaterals"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import TokenIcon from "@/components/ui/token-icon"

export default function ScrollableCollaterals({
  collaterals,
  emptyText,
  onValueChange,
  defaultValue = "",
  placeholder = "Select collateral",
  value = "",
  className = "",
}: {
  collaterals: Collateral[] | undefined
  emptyText?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
  placeholder?: string
  value?: string
  className?: string
}) {
  if (!collaterals) {
    return <></>
  }
  return (
    <div className="rounded-lg bg-primary/10 p-px">
      <Select
        onValueChange={onValueChange}
        defaultValue={defaultValue}
        value={value}
      >
        <SelectTrigger
          className={cn(
            className,
            "rounded-lg bg-gray-800 bg-opacity-10 text-white text-opacity-60"
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Available Collaterals</SelectLabel>
            {emptyText && (
              <SelectItem value="1" key={"empty"}>
                <div className="flex items-center space-x-2">
                  <div>
                    <X />
                  </div>
                  <div>{emptyText}</div>
                </div>
              </SelectItem>
            )}
            {collaterals &&
              collaterals.map((collateral: Collateral, index) => {
                return (
                  <SelectItem
                    key={collateral.address}
                    value={collateral.address}
                  >
                    <div className="flex items-center space-x-2">
                      <TokenIcon
                        symbol={collateral.tokenName}
                        width={24}
                        height={24}
                      ></TokenIcon>
                      <div>{collateral.tokenName}</div>
                    </div>
                  </SelectItem>
                )
              })}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
