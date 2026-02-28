import { Skeleton } from "@/components/ui/skeleton"

export default function StabilityPoolLoading() {
  return (
    <div className="container flex min-h-[400px] flex-col gap-6 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64" />
    </div>
  )
}
