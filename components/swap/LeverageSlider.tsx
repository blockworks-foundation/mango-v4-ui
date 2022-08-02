import { toUiDecimals } from '@blockworks-foundation/mango-v4'
import { ChangeEvent, ChangeEventHandler, useMemo } from 'react'
import mangoStore from '../../store/state'
import { formatDecimal } from '../../utils/numbers'

type LeverageSliderProps = {
  inputToken?: string
  outputToken?: string
  onChange: (x: string) => void
}

const LeverageSlider = ({
  inputToken,
  outputToken,
  onChange,
}: LeverageSliderProps) => {
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)
  const group = mangoStore((s) => s.group)

  const leverageMax = useMemo(() => {
    if (!mangoAccount || !group) return '100'

    let max
    if (inputToken && outputToken) {
      max = toUiDecimals(
        mangoAccount
          .getMaxSourceForTokenSwap(group, inputToken, outputToken, 1)
          .toNumber()
      )
    } else {
      // needs to be calculated if we want to use this same component for borrowing
      max = 100
    }

    return formatDecimal(max)
  }, [mangoAccount, inputToken, outputToken, group])

  const handleSliderChange = (e: ChangeEvent<HTMLInputElement>) => {
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
        step={0.0001}
        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-th-bkg-4 hover:bg-gradient-to-r hover:from-gradient-start hover:via-gradient-mid hover:to-gradient-end"
        onChange={handleSliderChange}
      ></input>
    </>
  )
}

export default LeverageSlider
