import { Skeleton } from "@/components/ui/skeleton"

export default function VaultsLoading() {
  return (
    <div className="container flex min-h-[400px] flex-col gap-6 p-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    </div>
  )
}
