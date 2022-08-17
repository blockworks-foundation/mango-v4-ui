import { toUiDecimals } from '@blockworks-foundation/mango-v4'
import { ChangeEvent, useMemo } from 'react'
import mangoStore from '../../store/state'

type LeverageSliderProps = {
  inputToken?: string
  outputToken?: string
  onChange: (x: string) => void
}

const LeverageSlider = ({
  leverageMax,
  onChange,
}: {
  leverageMax: number
  onChange: (x: any) => any
}) => {
  const handleSliderChange = (e: ChangeEvent<HTMLInputElement>) => {
    let target = e.target
    const min = parseFloat(target.min)
    const max = parseFloat(target.max)
    const val = parseFloat(target.value)

    target.style.backgroundSize = ((val - min) * 100) / (max - min) + '% 100%'
    onChange(e.target.value)
  }

  return (
    <>
      <label htmlFor="default-range" className="block text-sm"></label>
      <input
        id="default-range"
        type="range"
        min="0"
        max={leverageMax}
        step={0.000001}
        className="w-full"
        onChange={handleSliderChange}
      ></input>
    </>
  )
}

export const SwapLeverageSlider = ({
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
      <LeverageSlider leverageMax={leverageMax} onChange={onChange} />
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
