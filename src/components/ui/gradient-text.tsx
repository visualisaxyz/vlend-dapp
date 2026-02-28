import { cn } from "@/lib/utils"

export default function GradientText({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span className={cn("font-semibold text-primary", className)}>
      {children}
    </span>
  )
}
