"use client"

import HFGauge from "./hf-gauge"
import Tag from "./tag"

export type VaultCardData = {
  id: string
  address: string
  collateral: number
  collateralUSD: number
  debtVUSD: number
  healthFactor: number
  collateralRatio: number
  status: "safe" | "warning"
}

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

type VaultCardProps = {
  vault: VaultCardData
  onManage: (vault: VaultCardData) => void
}

export default function VaultCard({ vault, onManage }: VaultCardProps) {
  const color = hfColor(vault.healthFactor)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onManage(vault)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onManage(vault)
      }}
      className="relative cursor-pointer overflow-hidden rounded-2xl border p-[18px] transition-all duration-150 hover:border-white/14"
      style={{
        background: "rgba(255,255,255,0.025)",
        borderColor:
          vault.status === "warning"
            ? "rgba(234,179,8,0.22)"
            : "rgba(255,255,255,0.08)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.04)"
        e.currentTarget.style.borderColor =
          vault.status === "warning"
            ? "rgba(234,179,8,0.35)"
            : "rgba(255,255,255,0.14)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.025)"
        e.currentTarget.style.borderColor =
          vault.status === "warning"
            ? "rgba(234,179,8,0.22)"
            : "rgba(255,255,255,0.08)"
      }}
    >
      {vault.status === "warning" && (
        <div
          className="absolute left-0 right-0 top-0 h-0.5"
          style={{
            background: "linear-gradient(90deg,#eab308,transparent)",
          }}
        />
      )}
      <div className="mb-3.5 flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="font-mono text-[13px] font-semibold text-zinc-200">
              Vault #{vault.id}
            </span>
            <Tag color={color} small>
              {hfLabel(vault.healthFactor)}
            </Tag>
          </div>
          <div className="font-mono text-[10px] text-zinc-500">
            Click to manage
          </div>
        </div>
        <HFGauge hf={vault.healthFactor} size={72} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          {
            label: "Collateral",
            val: `${vault.collateral.toFixed(2)} WETH`,
            sub: `$${vault.collateralUSD.toLocaleString()}`,
          },
          {
            label: "Debt",
            val: `${vault.debtVUSD.toLocaleString()} vUSD`,
            sub: null,
          },
          {
            label: "CR",
            val: `${vault.collateralRatio.toFixed(1)}%`,
            sub: "Min 110%",
            color,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg bg-white/[0.03] px-2.5 py-2"
          >
            <div className="mb-1 font-mono text-[9px] uppercase tracking-wider text-zinc-500">
              {s.label}
            </div>
            <div
              className="font-mono text-[13px] font-medium"
              style={{ color: s.color ?? "#e4e4e7" }}
            >
              {s.val}
            </div>
            {s.sub && (
              <div className="mt-0.5 font-mono text-[9px] text-zinc-500">
                {s.sub}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
