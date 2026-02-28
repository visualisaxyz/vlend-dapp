"use client"

import * as React from "react"
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type SelectItems = {
  value: string
  label: string
  icon?: React.ReactNode
}[]

export function ComboBox({
  values,
  placeholder = "Select...",
  notFoundText = "No items found",
  onValueChange,
  defaultValue = "",
  className,
  selectClassName,
}: {
  values: SelectItems | undefined
  placeholder?: string
  notFoundText?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
  className?: string
  selectClassName?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState(defaultValue)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-[200px] justify-between text-muted-foreground", className)}
        >
          {value && values
            ? values.find(
                (item) =>
                  item.value.toLowerCase().trim() === value.toLowerCase().trim()
              )?.label
            : placeholder}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-[200px] p-0", selectClassName)}>
        <Command>
          <CommandInput placeholder={placeholder} className="h-9" />
          <CommandEmpty>{notFoundText}</CommandEmpty>
          <CommandGroup className="max-h-[200px] overflow-y-scroll">
            {values &&
              values.map((item) => {
                return (
                  <CommandItem
                    key={item.value}
                    value={item.value}
                    onSelect={(currentValue) => {
                      const newValue =
                        currentValue.toLowerCase().trim() ===
                        value.toLowerCase().trim()
                          ? ""
                          : currentValue
                      setValue(newValue)
                      if (onValueChange) {
                        onValueChange(newValue)
                      }

                      setOpen(false)
                    }}
                  >
                    {item.icon && <div className="mr-2">{item.icon}</div>}
                    {item.label}
                    <CheckIcon
                      className={cn(
                        "ml-auto h-4 w-4",
                        value.toLowerCase().trim() ===
                          item.value.toLowerCase().trim()
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                )
              })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
