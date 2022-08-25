import { ChangeEvent, useEffect, useRef, useState } from 'react'
import mangoStore from '../../store/mangoStore'
import { useTokenMax } from './SwapForm'

const LeverageSlider = ({
  amount,
  leverageMax,
  onChange,
}: {
  amount: number
  leverageMax: number
  onChange: (x: string) => any
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
      onChange(amount.toString())
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
        step={inputTokenInfo ? 1 / 10 ** inputTokenInfo?.decimals : 6}
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
}: {
  amount: number
  onChange: (x: string) => void
}) => {
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)
  const { amountWithBorrow } = useTokenMax()

  return (
    <>
      {!mangoAccount ? (
        <LeverageSlider amount={amount} leverageMax={100} onChange={onChange} />
      ) : (
        <LeverageSlider
          amount={amount}
          leverageMax={amountWithBorrow}
          onChange={onChange}
        />
      )}
    </>
  )
}

export const BorrowLeverageSlider = ({
  amount,
  tokenMax,
  onChange,
}: {
  amount: number
  tokenMax: number
  onChange: (x: string) => any
}) => {
  return (
    <>
      <LeverageSlider
        amount={amount}
        leverageMax={tokenMax}
        onChange={onChange}
      />
    </>
  )
}

export default LeverageSlider
