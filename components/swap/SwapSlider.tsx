import useMangoAccount from 'hooks/useMangoAccount'
import LeverageSlider from '../shared/LeverageSlider'
import { TokenMaxResults } from './useTokenMax'
import mangoStore from '@store/mangoStore'

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
  const { inputBank } = mangoStore((s) => s.swap)

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
          decimals={inputBank?.mintDecimals}
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
