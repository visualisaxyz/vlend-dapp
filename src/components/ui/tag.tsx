"use client"

type TagProps = {
  children: React.ReactNode
  color?: string
  small?: boolean
}

export default function Tag({
  children,
  color = "#22c55e",
  small = false,
}: TagProps) {
  return (
    <span
      className="rounded-md border font-mono font-semibold uppercase tracking-wider"
      style={{
        padding: small ? "1px 6px" : "2px 9px",
        fontSize: small ? 9 : 10,
        background: `${color}18`,
        borderColor: `${color}28`,
        color,
      }}
    >
      {children}
    </span>
  )
}
