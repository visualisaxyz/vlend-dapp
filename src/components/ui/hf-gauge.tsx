"use client"

function hfColor(hf: number): string {
  if (!isFinite(hf)) return "#22c55e"
  if (hf < 1.1) return "#ef4444"
  if (hf < 1.3) return "#f97316"
  if (hf < 1.5) return "#eab308"
  return "#22c55e"
}

function hfLabel(hf: number): string {
  if (!isFinite(hf)) return "Safe"
  if (hf < 1.1) return "Critical"
  if (hf < 1.3) return "High Risk"
  if (hf < 1.5) return "At Risk"
  return "Safe"
}

type HFGaugeProps = {
  hf: number
  size?: number
}

export default function HFGauge({ hf, size = 120 }: HFGaugeProps) {
  const safeHF = Math.min(isFinite(hf) ? hf : 3, 3)
  const pct = safeHF / 3
  const color = hfColor(hf)
  const R = size / 2 - 8
  const cx = size / 2
  const cy = size / 2
  const startAngle = 210 * (Math.PI / 180)
  const endAngle = 330 * (Math.PI / 180)
  const arcLength = 240
  const filledAngle = startAngle + (pct * arcLength * Math.PI) / 180

  function polarToXY(angle: number, r: number): [number, number] {
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)]
  }

  const [sx, sy] = polarToXY(startAngle, R)
  const [ex, ey] = polarToXY(endAngle, R)
  const [fx, fy] = polarToXY(filledAngle, R)
  const largeArc = (arcLength * pct) / 180 > 1 ? 1 : 0

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Track */}
      <path
        d={`M ${sx} ${sy} A ${R} ${R} 0 1 1 ${ex} ${ey}`}
        fill="none"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      {/* Fill */}
      {isFinite(hf) && (
        <path
          d={`M ${sx} ${sy} A ${R} ${R} 0 ${largeArc} 1 ${fx} ${fy}`}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${color}60)` }}
        />
      )}
      {/* Zone markers */}
      {[1.0, 1.3, 1.5].map((v) => {
        const a = startAngle + ((v / 3) * arcLength * Math.PI) / 180
        const [mx, my] = polarToXY(a, R + 2)
        const [mx2, my2] = polarToXY(a, R - 2)
        return (
          <line
            key={v}
            x1={mx}
            y1={my}
            x2={mx2}
            y2={my2}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1.5"
          />
        )
      })}
      {/* Center text - neutral so it doesn't blend with the colored bar */}
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        fill="#f4f4f5"
        className="font-mono text-[18px] font-semibold"
      >
        {isFinite(hf) ? hf.toFixed(2) : "∞"}
      </text>
      <text
        x={cx}
        y={cy + 12}
        textAnchor="middle"
        fill="#52525b"
        className="font-mono text-[9px] uppercase tracking-wider"
      >
        {hfLabel(hf)}
      </text>
    </svg>
  )
}
