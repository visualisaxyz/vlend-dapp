import "@/styles/globals.css"
import "@rainbow-me/rainbowkit/styles.css"

import type { Metadata, Viewport } from "next"
import { DM_Mono, DM_Sans } from "next/font/google"
import { ContextProvider } from "@/context"

import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import Header from "@/components/layout/header"
import { ThemeProvider } from "@/components/theme-provider"
import Footer from "@/components/layout/footer"

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
})

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono",
})

interface RootLayoutProps {
  children: React.ReactNode
}

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url.base),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url.base,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
  icons: {
    icon: "/favicon.ico",
  },
}

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#0a0f0a" }],
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          "min-h-screen antialiased bg-background",
          dmSans.variable,
          dmMono.variable,
          dmSans.className
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ContextProvider>
            <div className="flex min-h-screen flex-col">
              <div className="mt-0">
                <Header />
              </div>
              <div className="flex flex-1">
                <div className="main-content min-h-full flex-1 bg-background">
                  {children}
                </div>
              </div>
              <Footer />
            </div>
          </ContextProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
