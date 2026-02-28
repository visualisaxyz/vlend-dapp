"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function StakeVLENDPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/stability-pool?tab=cashback")
  }, [router])

  return (
    <div className="container flex min-h-[200px] items-center justify-center pb-10 pt-16">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}
