import useMangoAccount from 'hooks/useMangoAccount'
import LeverageSlider from '../shared/LeverageSlider'
import { TokenMaxResults } from './useTokenMax'
import mangoStore from '@store/mangoStore'
import { useMemo } from 'react'
import { floorToDecimal } from 'utils/numbers'

const SwapSlider = ({
  amount,
  onChange,
  useMargin,
  step,
  maxAmount,
  handleStartDrag,
  handleEndDrag,
}: {
  amount: number
  onChange: (x: string) => void
  useMargin: boolean
  step: number
  maxAmount: (useMargin: boolean) => TokenMaxResults
  handleStartDrag?: () => void
  handleEndDrag?: () => void
}) => {
  const { mangoAccount } = useMangoAccount()
  const { amount: tokenMax, amountWithBorrow } = maxAmount(useMargin)
  const { inputBank } = mangoStore((s) => s.swap)

  const max = useMemo(() => {
    if (!inputBank) return 0
    return useMargin
      ? floorToDecimal(amountWithBorrow, inputBank.mintDecimals).toNumber()
      : floorToDecimal(tokenMax, inputBank.mintDecimals).toNumber()
  }, [tokenMax, amountWithBorrow, inputBank, useMargin])

  return (
    <>
      {!mangoAccount ? (
        <LeverageSlider
          amount={amount}
          leverageMax={100}
          onChange={onChange}
          step={step}
          handleStartDrag={handleStartDrag}
          handleEndDrag={handleEndDrag}
        />
      ) : (
        <LeverageSlider
          amount={amount}
          decimals={inputBank?.mintDecimals}
          leverageMax={max}
          onChange={onChange}
          step={step}
          handleStartDrag={handleStartDrag}
          handleEndDrag={handleEndDrag}
        />
      )}
    </>
  )
}

export default SwapSlider
