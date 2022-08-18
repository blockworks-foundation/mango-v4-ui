import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { toUiDecimals } from '@blockworks-foundation/mango-v4'
import mangoStore from '../../store/state'

type LeverageSliderProps = {
  amount?: number
  inputToken?: string
  outputToken?: string
  onChange: (x: string) => void
}

const LeverageSlider = ({
  amount,
  leverageMax,
  onChange,
}: {
  amount?: number
  leverageMax: number
  onChange: (x: any) => any
}) => {
  const [value, setValue] = useState(0)
  const inputEl = useRef<HTMLInputElement>(null)

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
      onChange(amount)
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
        step={0.000001}
        className="w-full"
        onChange={handleSliderChange}
        value={value}
      ></input>
    </>
  )
}

export const SwapLeverageSlider = ({
  amount,
  inputToken,
  outputToken,
  onChange,
}: LeverageSliderProps) => {
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)
  const group = mangoStore((s) => s.group)

  const leverageMax = useMemo(() => {
    if (!mangoAccount || !group || !inputToken || !outputToken) return 100

    const bank = group.banksMap.get(inputToken)!
    const availableDeposits = bank.uiDeposits() - bank.uiBorrows()

    let max
    if (outputToken) {
      max = toUiDecimals(
        mangoAccount
          .getMaxSourceForTokenSwap(group, inputToken, outputToken, 0.9)
          .toNumber(),
        bank?.mintDecimals!
      )
    } else {
      max = availableDeposits
    }

    return Math.min(availableDeposits, max)
  }, [mangoAccount, inputToken, outputToken, group])

  return (
    <>
      <LeverageSlider
        amount={amount}
        leverageMax={leverageMax}
        onChange={onChange}
      />
    </>
  )
}

export const BorrowLeverageSlider = ({
  tokenMax,
  onChange,
}: {
  tokenMax: number
  onChange: (x: any) => any
}) => {
  return (
    <>
      <LeverageSlider leverageMax={tokenMax} onChange={onChange} />
    </>
  )
}

export default LeverageSlider
