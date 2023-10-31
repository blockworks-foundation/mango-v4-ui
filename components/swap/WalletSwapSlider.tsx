import mangoStore from '@store/mangoStore'
import LeverageSlider from '../shared/LeverageSlider'

const WalletSwapSlider = ({
  amount,
  onChange,
  step,
  maxAmount,
  handleStartDrag,
  handleEndDrag,
}: {
  amount: number
  onChange: (x: string) => void
  step: number
  maxAmount: number
  handleStartDrag: () => void
  handleEndDrag: () => void
}) => {
  const { inputBank } = mangoStore((s) => s.swap)
  return (
    <LeverageSlider
      amount={amount}
      decimals={inputBank?.mintDecimals}
      leverageMax={maxAmount}
      onChange={onChange}
      step={step}
      handleStartDrag={handleStartDrag}
      handleEndDrag={handleEndDrag}
    />
  )
}

export default WalletSwapSlider
