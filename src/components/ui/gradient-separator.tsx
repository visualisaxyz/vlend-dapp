import { cn } from "@/lib/utils"

import { Separator } from "./separator"

export default function GradientSeparator({ className = "" }) {
  return <Separator className={cn("my-4", className)} />
}
