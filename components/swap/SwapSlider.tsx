import mangoStore from '@store/mangoStore'
import useMangoAccount from 'hooks/useMangoAccount'
import { useCallback, useEffect, useState } from 'react'
import { formatFixedDecimals } from 'utils/numbers'
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
  const [sliderValue, setSliderValue] = useState(0)
  const { mangoAccount } = useMangoAccount()
  const { amount: tokenMax, amountWithBorrow } = useTokenMax(useMargin)
  const inputBank = mangoStore((s) => s.swap.inputBank)

  const handleChange = useCallback((x: string) => {
    setSliderValue(parseFloat(x))
    onChange(x)
  }, [])

  useEffect(() => {
    setSliderValue(amount)
  }, [amount])

  const tokenMaxAsNumber = tokenMax.toNumber()

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
        <>
          <LeverageSlider
            amount={amount}
            leverageMax={
              useMargin ? amountWithBorrow.toNumber() : tokenMax.toNumber()
            }
            onChange={handleChange}
            step={step}
          />
          {sliderValue && sliderValue > tokenMaxAsNumber ? (
            <div className="flex">
              <div className="mt-1 ml-1 -mb-5 text-xs text-th-fgd-4">
                Use {formatFixedDecimals(tokenMaxAsNumber)} {inputBank?.name} +
                Borrow {formatFixedDecimals(sliderValue - tokenMaxAsNumber)}{' '}
                {inputBank?.name}
              </div>
            </div>
          ) : null}
        </>
      )}
    </>
  )
}

export default SwapSlider
