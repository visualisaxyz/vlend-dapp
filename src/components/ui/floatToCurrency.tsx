"use client"

type FloatToCurrencyProps = {
  children?: number | string
  currency?: string
}

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

export default function FloatToCurrency({ children }: FloatToCurrencyProps) {
  if (children != null && children !== "") {
    return formatter.format(parseFloat(children.toString()))
  }

  return null
}
