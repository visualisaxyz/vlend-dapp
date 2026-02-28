import { defaultWagmiConfig } from "@web3modal/wagmi/react/config"
import { type Chain } from "viem"
import { cookieStorage, createStorage, http } from "wagmi"

// MegaETH mainnet - Chain ID 4326
export const megaeth: Chain = {
  id: 4326,
  name: "MegaETH",
  nativeCurrency: {
    decimals: 18,
    name: "ETH",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://mainnet.megaeth.com/rpc"],
    },
    public: {
      http: ["https://mainnet.megaeth.com/rpc"],
    },
  },
  blockExplorers: {
    default: {
      name: "MegaETH",
      url: "https://mega.etherscan.io",
    },
  },
}

export const projectId = "77dc27fe3bf095c060ee65314b6825e1"
const metadata = {
  name: "vLend",
  description: "A collateralized borrowing protocol for the MegaETH ecosystem",
  url: "https://vlend.visualisa.xyz",
  icons: ["https://vlend.visualisa.xyz/logo.png"],
}

export const config = defaultWagmiConfig({
  chains: [megaeth],
  projectId,
  metadata,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  enableWalletConnect: true,
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: true,
  transports: {
    [megaeth.id]: http(process.env.NEXT_PUBLIC_MEGAETH_RPC_URL ?? "https://mainnet.megaeth.com/rpc", {
      batch: true,
    }),
  },
})

export const apiUrls: Record<number, string> = {
  4326: process.env.NEXT_PUBLIC_API_URL ?? "https://api.vlend.visualisa.xyz",
}

export const explorerUrls: Record<number, string> = {
  4326: "https://mega.etherscan.io/tx/",
}

export const nativeWrappedTokens: Record<number, string> = {
  4326: "0x4200000000000000000000000000000000000006", // WETH on MegaETH
}

export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000"
export const MAX_ALLOWANCE = BigInt(
  "115792089237316195423570985008687907853269984665640564039457584007913129639935"
)

// vLend contract addresses (MegaETH mainnet)
export const vlendAddresses = {
  mintableToken: "0xcEbC154252CB96083e833e3fFa758eb0CEe85A9C" as const,
  mintableTokenOwner: "0xa96446cbE7419baD0ED3ebF6F5C77200355919c0" as const,
  tokenToPriceFeed: "0xfFF9f890bb45d1BDDF9A4ECF554D5C0a93Fa690D" as const,
  liquidationRouter: "0xfbb13c6f3C2324095bfaC66fbD242CFDFc5AE207" as const,
  vaultExtraSettings: "0x069Ee6624b9DD7D2127E963563e8Bd753A61c2ff" as const,
  vaultDeployer: "0xb3148990436C1A5F44a552d18d0d421c6DcE725b" as const,
  vaultBorrowRate: "0x5b69aD55564c3DE77192C26f1dB2664205FFA10B" as const,
  lastResortLiquidation: "0x2936A4D4F71CE35d633264f4cDf9B01e719205f9" as const,
  stabilizer: "0x62e6762a51440C14CE87F28cD1D630A2Caab2164" as const,
  vaultFactory: "0x006372418c2Fe8a1F26914E2bA59C69276061102" as const,
  stabilityPool: "0x21378b6c905B30340c47616ddA7aFE66a4F3A210" as const,
  vlendStaking: "0x38d30415faF50A7F4DF9EF456A0b98b1De395c48" as const,
  auctionManager: "0x50fda035714c2CceC9AB664e891Bb0A65A367D79" as const,
  vaultFactoryHelper: "0x7EF08Ce2B63Cc1641d26dB3eaA7Aa43f59983D11" as const,
  vaultFactoryZapper: "0x92EFA8B220F8730d4cF0E2D464901774E17F6Dc9" as const,
  vlendToken: "0xEF7cD76CcEA505b02AD9ba791BD44310096c3018" as const,
  weth: "0x4200000000000000000000000000000000000006" as const,
}

export enum AllowedChainIds {
  MegaETH = 4326,
}
