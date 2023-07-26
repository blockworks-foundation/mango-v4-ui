import useMangoAccount from 'hooks/useMangoAccount'
import LeverageSlider from '../shared/LeverageSlider'
import { useTokenMax } from './useTokenMax'

const SwapSlider = ({
  amount,
  onChange,
  useMargin,
  step,
}: {
  amount: number
  onChange: (x: string) => void
  useMargin: boolean
  step: number
}) => {
  const { mangoAccount } = useMangoAccount()
  const { amount: tokenMax, amountWithBorrow } = useTokenMax(useMargin)

  return (
    <>
      {!mangoAccount ? (
        <LeverageSlider
          amount={amount}
          leverageMax={100}
          onChange={onChange}
          step={step}
        />
      ) : (
        <LeverageSlider
          amount={amount}
          leverageMax={
            useMargin ? amountWithBorrow.toNumber() : tokenMax.toNumber()
          }
          onChange={onChange}
          step={step}
        />
      )}
    </>
  )
}

export default SwapSlider
