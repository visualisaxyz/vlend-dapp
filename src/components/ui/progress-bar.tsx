import { Skeleton } from "./skeleton"

export default function ProgressBar() {
  return (
    <div className="flex w-full max-w-56 flex-col gap-2">
      <Skeleton className="h-2 w-full" />
    </div>
  )
}
