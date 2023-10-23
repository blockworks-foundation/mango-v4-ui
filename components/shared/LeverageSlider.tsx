import Decimal from 'decimal.js'
import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react'
import { floorToDecimal } from 'utils/numbers'

const PERCENTAGE_SHORTCUTS = [10, 25, 50, 75, 100]

const LeverageSlider = ({
  amount,
  decimals,
  leverageMax,
  onChange,
  step,
}: {
  amount: number
  decimals?: number
  leverageMax: number
  onChange: (x: string) => void
  step: number
}) => {
  const [value, setValue] = useState(0)
  const [percent, setPercent] = useState(0)
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

  const handleShortcutButtons = useCallback(
    (percent: number) => {
      setPercent(percent)
      const maxDecimal = new Decimal(leverageMax)
      const percentDecimal = new Decimal(percent).div(100)
      const amountDecimal = maxDecimal.mul(percentDecimal)
      let amount = amountDecimal.toFixed()
      if (decimals) {
        amount = floorToDecimal(amountDecimal, decimals).toFixed()
      }
      onChange(amount)
      setValue(parseFloat(amount))
    },
    [decimals, leverageMax],
  )

  // set percent when max changes (toggling margin)
  useEffect(() => {
    const percent = ((value - leverageMax) / leverageMax) * 100 + 100
    setPercent(Math.round(percent))
  }, [leverageMax])

  // set percent to 100 on max button click
  useEffect(() => {
    if (amount === leverageMax) {
      setPercent(100)
    }
  }, [amount, leverageMax])

  useEffect(() => {
    if (amount) {
      setValue(amount)
    } else {
      setValue(0)
      setPercent(0)
    }
  }, [amount])

  const handleSliderChange = (e: ChangeEvent<HTMLInputElement>) => {
    const target = e.target
    const min = parseFloat(target.min)
    const max = parseFloat(target.max)
    const val = parseFloat(target.value)
    const percent = ((val - min) * 100) / (max - min)
    target.style.backgroundSize = percent + '% 100%'

    onChange(e.target.value)
    setValue(parseFloat(e.target.value))
    setPercent(Math.round(percent))
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
        className="w-full focus:outline-none"
        onChange={handleSliderChange}
        value={value}
      ></input>
      <div className="mt-1 flex justify-between">
        {PERCENTAGE_SHORTCUTS.map((p) => (
          <button
            className={`text-xxs focus:outline-none md:hover:text-th-active ${
              p <= percent ? 'text-th-active' : 'text-th-fgd-3'
            }`}
            key={p}
            onClick={() => handleShortcutButtons(p)}
            type="button"
          >
            {p}%
          </button>
        ))}
      </div>
    </>
  )
}

export default LeverageSlider
