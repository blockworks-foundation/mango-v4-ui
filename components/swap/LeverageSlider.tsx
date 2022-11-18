import Decimal from 'decimal.js'
import useMangoAccount from 'hooks/useMangoAccount'
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import mangoStore from '../../store/mangoStore'
import { getTokenInMax, useTokenMax } from './useTokenMax'

const LeverageSlider = ({
  amount,
  leverageMax,
  onChange,
  step,
}: {
  amount: number
  leverageMax: number
  onChange: (x: string) => any
  step: number
}) => {
  const [value, setValue] = useState(0)
  const inputEl = useRef<HTMLInputElement>(null)
  const inputTokenInfo = mangoStore((s) => s.swap.inputTokenInfo)

  useEffect(() => {
    if (inputEl.current) {
      const target = inputEl.current
      const min = parseFloat(target.min)
      const max = leverageMax

      target.style.backgroundSize =
        max - min === 0
          ? '0% 100%'
          : ((value - min) * 100) / (max - min) + '% 100%'
    }
  }, [leverageMax, value])

  useEffect(() => {
    if (amount) {
      onChange(new Decimal(amount).toFixed())
      setValue(amount)
    }
  }, [amount])

  const handleSliderChange = (e: ChangeEvent<HTMLInputElement>) => {
    let target = e.target
    const min = parseFloat(target.min)
    const max = parseFloat(target.max)
    const val = parseFloat(target.value)

    target.style.backgroundSize = ((val - min) * 100) / (max - min) + '% 100%'

    onChange(e.target.value)
    setValue(parseFloat(e.target.value))
  }

  return (
    <>
      <label htmlFor="default-range" className="block text-sm"></label>
      <input
        ref={inputEl}
        id="default-range"
        type="range"
        min="0"
        max={leverageMax}
        step={step}
        className="w-full"
        onChange={handleSliderChange}
        value={value}
      ></input>
    </>
  )
}

export const SwapLeverageSlider = ({
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
  const { amountWithBorrow } = useTokenMax(useMargin)

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
          leverageMax={amountWithBorrow.toNumber()}
          onChange={onChange}
          step={step}
        />
      )}
    </>
  )
}

// export const BorrowLeverageSlider = ({
//   amount,
//   tokenMax,
//   onChange,
// }: {
//   amount: number
//   tokenMax: number
//   onChange: (x: string) => any
// }) => {
//   return (
//     <>
//       <LeverageSlider
//         amount={amount}
//         leverageMax={tokenMax}
//         onChange={onChange}
//       />
//     </>
//   )
// }

export default LeverageSlider
