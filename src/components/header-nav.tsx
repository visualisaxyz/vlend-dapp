"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

import useAuctionsLive from "@/hooks/use-auctions-live"
import useStatistics from "@/hooks/use-statistics"
import useVaultsList, { type VaultList } from "@/hooks/use-vaults-list"
import { useAccount } from "wagmi"

import SidebarSettings from "./layout/sidebar-settings"

const TABS = [
  { title: "Dashboard", href: "/" },
  { title: "Borrow", href: "/vaults/create" },
  { title: "Stability Pool", href: "/stability-pool" },
  { title: "Redemptions", href: "/redemptions" },
  { title: "Auctions", href: "/auctions" },
  { title: "Stabilizer", href: "/swap" },
]

function isTabActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/" || pathname === "/home"
  return pathname.startsWith(href)
}

export function HeaderNav() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const { address } = useAccount()
  const { vaults } = useVaultsList()
  const { statistics } = useStatistics()
  const { auctions } = useAuctionsLive()

  const redemptionLimit = parseFloat(
    statistics?.healthFactor?.redemptionLimit ?? "1.5"
  )
  const ownVaultsAtRisk =
    address && vaults.length > 0
      ? vaults.filter(
          (v: VaultList) =>
            v.vaultOwner?.toLowerCase() === address.toLowerCase() &&
            parseFloat(v.healthFactor || "1") < redemptionLimit
        ).length
      : 0

  return (
    <header
      className="sticky top-0 z-50 flex h-[58px] items-center justify-between border-b border-white/[0.07] px-8"
      style={{
        background: "rgba(12,12,14,0.92)",
        backdropFilter: "blur(18px)",
      }}
    >
      {/* Left: Logo */}
      <div className="flex min-w-[130px] items-center gap-2">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo-black1.png"
            alt="vLend"
            width={36}
            height={36}
            className="h-9 w-auto"
            priority
          />
          <span className="font-mono text-[15px] font-medium tracking-wide">
            vLend
          </span>
        </Link>
      </div>

      {/* Center: Tab pill */}
      <nav className="hidden items-center md:flex">
        <div
          className="flex items-center gap-0.5 rounded-[13px] border border-white/[0.08] bg-white/[0.04] p-1"
        >
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex items-center rounded-lg px-4 py-1.5 text-[13px] font-medium transition-all ${
                isTabActive(tab.href, pathname)
                  ? "bg-white/[0.08] text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.title}
              {tab.title === "Auctions" && auctions.length > 0 && (
                <span className="ml-1.5 rounded-full bg-red-500/20 px-1.5 py-0.5 font-mono text-[9px] text-red-500">
                  {auctions.length}
                </span>
              )}
              {tab.title === "Redemptions" && ownVaultsAtRisk > 0 && (
                <span
                  className="ml-1.5 rounded-full bg-red-500/20 px-1.5 py-0.5 font-mono text-[9px] text-red-500"
                >
                  {ownVaultsAtRisk}
                </span>
              )}
            </Link>
          ))}
        </div>
      </nav>

      {/* Right: MegaETH + Wallet */}
      <div className="flex min-w-[130px] items-center justify-end gap-2">
        <span
          className="rounded-md border border-white/[0.12] px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-widest text-zinc-300"
        >
          MegaETH
        </span>

        <div className="[&_button]:rounded-lg [&_button]:border [&_button]:border-white/[0.12] [&_button]:bg-zinc-800/95 [&_button]:px-3.5 [&_button]:py-1.5 [&_button]:text-xs [&_button]:font-semibold [&_button]:text-zinc-300 [&_button]:transition-all hover:[&_button]:border-white/20 hover:[&_button]:bg-zinc-700/95 hover:[&_button]:text-white">
          <w3m-button balance="hide" size="sm" />
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px]">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <div className="mt-6 flex flex-col gap-2">
              <SidebarSettings
                isMobile
                onClick={() => setMobileOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
