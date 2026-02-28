import { SiteConfig } from "@/types"

import { env } from "@/env.mjs"

export const siteConfig: SiteConfig = {
  name: "vLend",
  description: "A collateralized borrowing protocol for the MegaETH ecosystem",
  url: {
    base: "https://vlend.visualisa.xyz",
    author: "https://visualisa.xyz",
  },
  ogImage: `https://vlend.visualisa.xyz/apple-touch-icon.png`,
}
