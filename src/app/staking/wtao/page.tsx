"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function StakeWtaoRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/staking/vlend")
  }, [router])
  return null
}
