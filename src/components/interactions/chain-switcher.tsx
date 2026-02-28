import { useState } from "react"
import Image from "next/image"
import ARBLogo from "@/assets/arb-logo.png"
import ETHLogo from "@/assets/eth-icon.png"
import TAO from "@/assets/taologo.png"
import { Check, ChevronsUpDown } from "lucide-react"
import { useAccount, useSwitchChain } from "wagmi"

import { cn } from "@/lib/utils"
import useInternalChainId from "@/hooks/use-internal-chain-id"

import { Button } from "../ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "../ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"

const chainMeta: Record<number, any> = {
  1: { image: ETHLogo, shortName: "ETH" },
  42161: { image: ARBLogo, shortName: "ARB" },
  964: { image: TAO, shortName: "TAO" },
}

export const ChainSwitcher = () => {
  const [open, setOpen] = useState(false)

  const { switchChain, chains, isPending } = useSwitchChain({
    mutation: { onSuccess: () => setOpen(false) },
  })
  const chainId = useInternalChainId()
  const mappedChains = chains.map((c) => {
    const { image, shortName } = chainMeta[c.id]

    return { ...c, image, shortName }
  })

  const { isConnected } = useAccount()

  const selected = mappedChains.find((c) => c.id === chainId)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          disabled={isPending}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "text-s -mr-5 h-[31px] w-[100px] justify-between space-x-1 rounded-2xl border-[0.5px] border-[#3feac1] border-opacity-20 bg-transparent px-2 py-0  text-[#3feac1] ",
            {
              "-mr-3": !isConnected,
            }
          )}
        >
          {selected && (
            <Image
              alt="test"
              width={20}
              height={20}
              src={selected?.image}
              className="rounded-full"
            />
          )}
          {selected ? selected?.shortName : "Loading..."}
          <ChevronsUpDown className="ml-3 h-4 w-4 shrink-0 " />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="bg-card w-[200px] p-0">
        <Command>
          <CommandGroup className="w-full">
            {mappedChains.map((chain) => (
              <CommandItem
                className="w-full flex-1 cursor-pointer"
                key={chain.id}
                disabled={isPending}
                value={String(chain.id)}
                onSelect={(v) =>
                  Number(v) !== chainId && switchChain({ chainId: Number(v) })
                }
              >
                <Image
                  alt="test"
                  width={30}
                  height={30}
                  src={chain.image}
                  className="rounded-full"
                />
                <p className="ml-2 w-full">{chain.name}</p>
                {selected?.id === chain.id && (
                  <Check color="white" className="ml-auto" />
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
