import LeverageSlider from '../shared/LeverageSlider'

const WalletSwapSlider = ({
  amount,
  onChange,
  step,
  maxAmount,
}: {
  amount: number
  onChange: (x: string) => void
  step: number
  maxAmount: number
}) => {
  return (
    <LeverageSlider
      amount={amount}
      leverageMax={maxAmount}
      onChange={onChange}
      step={step}
    />
  )
}

export default WalletSwapSlider
