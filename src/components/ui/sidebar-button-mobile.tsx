import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type SidebarButtonProps = {
  onClick?: () => void
  children?: React.ReactNode
  icon: React.ReactNode
  selected?: boolean
  link?: string
}

export default function SidebarButtonMobile({
  onClick,
  children,
  icon,
  selected,
  link,
}: SidebarButtonProps) {
  return (
    <a
      onClick={onClick}
      href={link}
      className={`flex cursor-pointer items-center rounded-md text-center font-extrabold transition-all duration-200  hover:border-opacity-100 lg:space-x-3 ${selected ? `bg-primary text-primary-foreground` : `hover:text-primary border-transparent`} p-2 lg:p-5`}
    >
      <span className="inline flex-1 text-center">{children}</span>
    </a>
  )
}
