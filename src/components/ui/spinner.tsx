"use client"

import Image from "next/image"
import loader from "@/assets/loader.webp"

export default function Spinner() {
  return (
    <div className="absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2">
      <div className="animate-spin">
        <Image src={loader} alt="" className="grayscale" />
      </div>
    </div>
  )
}
