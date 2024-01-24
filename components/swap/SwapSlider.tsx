import useMangoAccount from 'hooks/useMangoAccount'
import LeverageSlider from '../shared/LeverageSlider'
import { TokenMaxResults } from './useTokenMax'
import mangoStore from '@store/mangoStore'
import { useMemo } from 'react'
import { floorToDecimal } from 'utils/numbers'
import TokenMaxAmountWarnings from '@components/shared/TokenMaxAmountWarnings'

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
  const {
    amount: tokenMax,
    amountWithBorrow,
    amountIsLimited,
    amountWithBorrowIsLimited,
  } = maxAmount(useMargin)
  const { inputBank, outputBank } = mangoStore((s) => s.swap)

  const max = useMemo(() => {
    if (!inputBank) return 0
    return useMargin
      ? floorToDecimal(amountWithBorrow, inputBank.mintDecimals).toNumber()
      : floorToDecimal(tokenMax, inputBank.mintDecimals).toNumber()
  }, [tokenMax, amountWithBorrow, inputBank, useMargin])

  return (
    <>
      {!mangoAccount ? (
        <>
          <LeverageSlider
            amount={amount}
            leverageMax={100}
            onChange={onChange}
            step={step}
            handleStartDrag={handleStartDrag}
            handleEndDrag={handleEndDrag}
          />
          <TokenMaxAmountWarnings
            className="mt-4"
            limitNearlyReached={
              useMargin ? amountWithBorrowIsLimited : amountIsLimited
            }
            bank={outputBank}
          />
        </>
      ) : (
        <>
          <LeverageSlider
            amount={amount}
            decimals={inputBank?.mintDecimals}
            leverageMax={max}
            onChange={onChange}
            step={step}
            handleStartDrag={handleStartDrag}
            handleEndDrag={handleEndDrag}
          />
          <TokenMaxAmountWarnings
            limitNearlyReached={
              useMargin ? amountWithBorrowIsLimited : amountIsLimited
            }
            className="mt-4"
            bank={outputBank}
          />
        </>
      )}
    </>
  )
}

export default SwapSlider
