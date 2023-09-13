import useMangoAccount from 'hooks/useMangoAccount'
import LeverageSlider from '../shared/LeverageSlider'
import { TokenMaxResults } from './useTokenMax'

const SwapSlider = ({
  amount,
  onChange,
  useMargin,
  step,
  maxAmount,
}: {
  amount: number
  onChange: (x: string) => void
  useMargin: boolean
  step: number
  maxAmount: (useMargin: boolean) => TokenMaxResults
}) => {
  const { mangoAccount } = useMangoAccount()
  const { amount: tokenMax, amountWithBorrow } = maxAmount(useMargin)

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
