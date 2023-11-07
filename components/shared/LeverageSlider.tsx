import Decimal from 'decimal.js'
import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { floorToDecimal } from 'utils/numbers'

const PERCENTAGE_SHORTCUTS = [10, 25, 50, 75, 100]

const LeverageSlider = ({
  amount = 0,
  decimals,
  handleStartDrag,
  handleEndDrag,
  leverageMax,
  onChange,
  step,
}: {
  amount: number
  decimals?: number
  handleStartDrag?: () => void
  handleEndDrag?: () => void
  leverageMax: number
  onChange: (x: string) => void
  step: number
}) => {
  const [percent, setPercent] = useState(0)
  const inputEl = useRef<HTMLInputElement>(null)

  const sliderValue = useMemo(() => {
    if (!amount || isNaN(amount)) return 0
    return amount
  }, [amount])

  useEffect(() => {
    if (inputEl.current) {
      const target = inputEl.current
      const min = parseFloat(target.min)
      const max = leverageMax

      target.style.backgroundSize =
        max - min === 0
          ? '0% 100%'
          : ((sliderValue - min) * 100) / (max - min) + '% 100%'
    }
  }, [leverageMax, sliderValue])

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
    },
    [decimals, leverageMax],
  )

  useEffect(() => {
    if (amount) {
      const percent = ((amount - leverageMax) / leverageMax) * 100 + 100
      onChange(amount.toString())
      setPercent(Math.ceil(percent))
    } else {
      setPercent(0)
    }
  }, [amount, leverageMax])

  const handleSliderChange = (e: ChangeEvent<HTMLInputElement>) => {
    const target = e.target
    const min = parseFloat(target.min)
    const max = parseFloat(target.max)
    const val = parseFloat(target.value)
    const percent = ((val - min) * 100) / (max - min)
    target.style.backgroundSize = percent + '% 100%'

    onChange(e.target.value)
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
        value={sliderValue}
        onMouseDown={handleStartDrag}
        onMouseUp={handleEndDrag}
        onKeyDown={handleStartDrag}
        onKeyUp={handleEndDrag}
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
