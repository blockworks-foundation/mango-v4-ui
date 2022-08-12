import { toUiDecimals } from '@blockworks-foundation/mango-v4'
import { ChangeEvent, useMemo } from 'react'
import mangoStore from '../../store/state'

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
    if (!mangoAccount || !group || !inputToken || !outputToken) return '100'

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
        step={0.000001}
        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-th-bkg-4 hover:bg-gradient-to-r hover:from-gradient-start hover:via-gradient-mid hover:to-gradient-end"
        onChange={handleSliderChange}
      ></input>
    </>
  )
}

export default LeverageSlider
