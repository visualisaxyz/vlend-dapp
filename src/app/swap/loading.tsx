import { Skeleton } from "@/components/ui/skeleton"

export default function SwapLoading() {
  return (
    <div className="container flex min-h-[400px] items-center justify-center p-6">
      <Skeleton className="h-96 w-full max-w-md" />
    </div>
  )
}
