"use client"

type FloatToPrettyNumberProps = {
  children?: number | string
  style?: "decimal" | "currency" | "unit" | "percent" | undefined
}

export default function FloatToPrettyNumber({
  children,
  style = "decimal",
}: FloatToPrettyNumberProps) {
  if (children != null && children !== "") {
    return new Intl.NumberFormat("en-US", { style }).format(
      parseFloat(children.toString())
    )
  }

  return null
}
