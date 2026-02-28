type HealthFactorProps = {
  value: number
  threshold: number
}

export default function HealthFactor({ value, threshold }: HealthFactorProps) {
  const internalValue = value > 100 ? 100 : value

  const greenColor = "text-green-500"
  const orangeColor = "text-lime-500"
  const redColor = "text-red-500"

  let color =
    value > threshold * 1.1 ? greenColor : value > 4 ? orangeColor : redColor

  return (
    <span className={`font-semibold ${color}`}>{internalValue.toFixed(2)}</span>
  )
}
