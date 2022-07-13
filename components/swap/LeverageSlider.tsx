import { ChangeEvent, ChangeEventHandler, useMemo } from 'react'
import mangoStore from '../../store/state'
import { formatDecimal } from '../../utils/numbers'

type LeverageSliderProps = {
  inputToken: string
  onChange: (x: string) => void
}

const LeverageSlider = ({ inputToken, onChange }: LeverageSliderProps) => {
  const mangoAccount = mangoStore((s) => s.mangoAccount)
  const group = mangoStore((s) => s.group)

  const leverageMax = useMemo(() => {
    if (!mangoAccount || !group) return '100'

    const bank = group.banksMap.get(inputToken)
    if (!bank) return '100'

    return formatDecimal(mangoAccount.getUi(bank))
  }, [mangoAccount, inputToken, group])

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
        className="mb-6 h-1 w-full cursor-pointer appearance-none rounded-lg bg-th-bkg-4 hover:bg-gradient-to-r hover:from-gradient-start hover:via-gradient-mid hover:to-gradient-end"
        onChange={handleSliderChange}
      ></input>
    </>
  )
}

export default LeverageSlider
