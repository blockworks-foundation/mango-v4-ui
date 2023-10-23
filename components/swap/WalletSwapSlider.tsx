import mangoStore from '@store/mangoStore'
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
  const { inputBank } = mangoStore((s) => s.swap)
  return (
    <LeverageSlider
      amount={amount}
      decimals={inputBank?.mintDecimals}
      leverageMax={maxAmount}
      onChange={onChange}
      step={step}
    />
  )
}

export default WalletSwapSlider
