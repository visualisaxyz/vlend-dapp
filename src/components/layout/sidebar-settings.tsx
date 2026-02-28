"use client"

import { usePathname, useRouter } from "next/navigation"
import {
  Activity,
  BarChartBig,
  Database,
  Droplets,
  FileText,
  Gavel,
  LineChart,
  Vault,
} from "lucide-react"

import SidebarButton from "../ui/sidebar-button"
import SidebarButtonMobile from "../ui/sidebar-button-mobile"

export type SidebarLink = {
  title: string
  href: string | string[]
  icon: React.ReactNode
  selected?: boolean
  isHome?: boolean
}

export const SidebarLinks = [
  {
    title: "Home",
    href: ["/", "/home"],
    icon: <Vault />,
    isHome: true,
  },
  {
    title: "Vaults",
    href: ["/vaults", "/vaults/create", "/vault/"],
    icon: <Vault />,
  },
  {
    title: "Stability Pool",
    href: "/stability-pool",
    icon: <Droplets />,
  },
  {
    title: "Redemptions",
    href: "/redemptions",
    icon: <Activity />,
  },
  {
    title: "Auctions",
    href: "/auctions",
    icon: <Gavel />,
  },
  {
    title: "Staking",
    href: "/staking/vlend",
    icon: <Database />,
  },
  {
    title: "Yields",
    href: "/yields",
    icon: <LineChart />,
  },
  {
    title: "Swap",
    href: "/swap",
    icon: <BarChartBig />,
  },
  {
    title: "Statistics",
    href: "/statistics",
    icon: <Activity />,
  },
  {
    title: "Docs",
    href: "https://docs.megaeth.com",
    icon: <FileText />,
  },
]

function urlStartsWith(href: string | string[], pathname: string) {
  if (Array.isArray(href)) {
    return href.some((link) => pathname.startsWith(link))
  }
  return pathname.startsWith(href)
}

export default function SidebarSettings({
  isMobile,
  onClick,
}: {
  isMobile: boolean
  onClick?: () => void
}) {
  const router = useRouter()
  const pathname = usePathname()
  if (isMobile) {
    return (
      <>
        {SidebarLinks.map((link, index) => (
          <SidebarButtonMobile
            key={index}
            icon={link.icon}
            onClick={() => {
              if (typeof link.href === "string" && link.href.startsWith("http")) {
                window.open(link.href, "_blank")
              } else if (Array.isArray(link.href)) {
                router.push(link.href[0])
              } else {
                router.push(link.href)
              }
              if (onClick) onClick()
            }}
            selected={
              typeof link.href === "string" && link.href.startsWith("http")
                ? false
                : urlStartsWith(link.href, pathname) ||
                    (pathname === "/" && link.isHome)
                  ? true
                  : false
            }
          >
            {link.title}
          </SidebarButtonMobile>
        ))}
      </>
    )
  } else {
    return (
      <>
        {SidebarLinks.map((link, index) => (
          <SidebarButton
            key={index}
            onClick={() => {
              if (typeof link.href === "string" && link.href.startsWith("http")) {
                window.open(link.href, "_blank")
              } else if (Array.isArray(link.href)) {
                router.push(link.href[0])
              } else {
                router.push(link.href)
              }
              if (onClick) onClick()
            }}
            selected={
              typeof link.href === "string" && link.href.startsWith("http")
                ? false
                : urlStartsWith(link.href, pathname) ||
                    (pathname === "/" && link.isHome)
                  ? true
                  : false
            }
          >
            {link.title}
          </SidebarButton>
        ))}
      </>
    )
  }
}
