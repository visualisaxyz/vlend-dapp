import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type SidebarButtonProps = {
  onClick?: () => void
  children?: React.ReactNode
  selected?: boolean
  link?: string
}

export default function SidebarButton({
  onClick,
  children,
  selected,
  link,
}: SidebarButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <a
          onClick={onClick}
          href={link}
          className={cn(
            "flex cursor-pointer items-center rounded-lg p-1 text-center text-primary transition-all duration-200 md:px-2 lg:space-x-3 lg:px-4",
            selected ? "bg-white bg-opacity-10 px-4 py-1" : ""
          )}
        >
          <span className={"flex-1 rounded-lg text-center"}>{children}</span>
        </a>
      </Tooltip>
    </TooltipProvider>
  )
}
