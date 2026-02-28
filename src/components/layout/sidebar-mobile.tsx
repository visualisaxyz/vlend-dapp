"use client"

import Image from "next/image"
import Link from "next/link"
import { X } from "lucide-react"

import SidebarButtonMobile from "../ui/sidebar-button-mobile"
import SidebarSettings from "./sidebar-settings"

export default function SidebarMobile({
  open,
  setIsOpen,
}: {
  open: boolean
  setIsOpen: Function
}) {
  const closedWidth = "w-full h-0 opacity-0 z-[-1]"
  const openWidth = "w-full h-full opacity-100 z-30"
  return (
    <div
      className={`fixed left-0 top-0 ${open ? openWidth : closedWidth} z-50 transition-all duration-200`}
    >
      <div className="h-screen border-r bg-background pt-8 transition-all duration-200 ease-out md:block md:w-64 lg:w-96">
        <div className="container relative flex items-center justify-center px-4">
          <div className="flex flex-1 items-center justify-center space-x-4">
            <Link className="flex items-center space-x-2 font-bold" href="/">
              <Image src="/logo.png" alt="vLend" width={40} height={40} />
              <span className="text-lg font-bold">vLend</span>
            </Link>
          </div>
          <div className="absolute right-4 items-center md:hidden">
            <a href="#" onClick={() => setIsOpen(false)}>
              <X />
            </a>
          </div>
        </div>
        <div className="p-10">
          <div className="flex w-full flex-col items-center items-stretch space-y-6">
            <SidebarSettings isMobile={true} onClick={() => setIsOpen(false)} />
          </div>
        </div>
      </div>
    </div>
  )
}
