import { LiFiWidget, WidgetConfig } from "@lifi/widget"

export default function SwapWidget() {
  const widgetConfig: WidgetConfig = {
    integrator: "vLend",
    chains: {
      allow: [4326] as any,
    },
    bridges: {
      allow: [],
    },
    containerStyle: {
      width: "100%",
      maxWidth: "fit-content",
    },
    tokens: {
      featured: [
        {
          address: "0xcEbC154252CB96083e833e3fFa758eb0CEe85A9C",
          symbol: "vUSD",
          decimals: 18,
          chainId: 4326 as any,
          name: "vUSD",
        },
        {
          address: "0xEF7cD76CcEA505b02AD9ba791BD44310096c3018",
          symbol: "VLEND",
          decimals: 18,
          chainId: 4326 as any,
          name: "VLEND",
        },
        {
          address: "0x4200000000000000000000000000000000000006",
          symbol: "WETH",
          decimals: 18,
          chainId: 4326 as any,
          name: "Wrapped Ether",
        },
      ],
    },
  }
  return <LiFiWidget config={widgetConfig} integrator="vLend" />
}
