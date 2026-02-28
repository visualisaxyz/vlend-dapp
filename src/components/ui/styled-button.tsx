import Link from "next/link"

import { cn } from "@/lib/utils"

import { buttonVariants } from "./button"

type StyledButtonProps = {
  onClick?: (e: React.MouseEvent) => void
  children?: React.ReactNode
  icon?: React.ReactNode
  link?: string
  className?: string
  isLoading?: boolean
  disabled?: boolean
  target?: string
}

export default function StyledButton({
  onClick,
  children,
  icon,
  link = "#",
  className,
  isLoading = false,
  disabled = false,
  target,
}: StyledButtonProps) {
  return (
    <Link
      href={disabled ? "#" : link}
      target={target}
      onClick={(e) => {
        if (!disabled && onClick) onClick(e)
        if (disabled) e.preventDefault()
      }}
      className={cn(
        buttonVariants({ variant: "default" }),
        "inline-flex items-center justify-center gap-2",
        className,
        (isLoading || disabled) && "pointer-events-none opacity-60"
      )}
    >
      {icon}
      {isLoading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        children
      )}
    </Link>
  )
}
