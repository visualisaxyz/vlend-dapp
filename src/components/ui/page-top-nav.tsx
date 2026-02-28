import { cn } from "@/lib/utils"

type PageTopNavProps = {
  children?: React.ReactNode
  className?: string
}

export default function PageTopNav({ children, className }: PageTopNavProps) {
  return (
    <div
      className={cn(
        "flex justify-center border-b border-border bg-muted/50 px-4 py-4 font-semibold",
        className
      )}
    >
      {children}
    </div>
  )
}
