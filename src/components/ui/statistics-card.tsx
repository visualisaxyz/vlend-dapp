import { cn } from "@/lib/utils"

import { Card, CardContent, CardHeader } from "./card"

type StatisticsCardProps = {
  onClick?: () => void
  children?: React.ReactNode
  title?: string | React.ReactNode
  className?: string
  description?: string
}

export default function StatisticsCard({
  onClick,
  children,
  title,
  className = "",
  description = "",
}: StatisticsCardProps) {
  return (
    <Card
      className={cn("h-full transition-colors hover:border-primary/30", className)}
      onClick={onClick}
    >
      {title && (
        <CardHeader className="pb-2">
          <div className="flex flex-col items-start">
            <div className="text-lg font-medium text-foreground">{title}</div>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent className={title ? "pt-0" : ""}>{children}</CardContent>
    </Card>
  )
}
