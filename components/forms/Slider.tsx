import { ChangeEvent, useEffect, useRef, useState } from 'react'

const Slider = ({
  amount,
  max,
  min,
  onChange,
  step,
}: {
  amount: number
  max?: string
  min?: string
  onChange: (x: string) => void
  step: number
}) => {
  const [value, setValue] = useState(0)
  const inputEl = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputEl.current) {
      const target = inputEl.current
      const min = parseFloat(target.min)
      const max = parseFloat(target.max)

      target.style.backgroundSize =
        max - min === 0
          ? '0% 100%'
          : ((value - min) * 100) / (max - min) + '% 100%'
    }
  }, [value, max])

  useEffect(() => {
    if (amount) {
      setValue(amount)
    } else {
      setValue(0)
    }
  }, [amount])

  const handleSliderChange = (e: ChangeEvent<HTMLInputElement>) => {
    const target = e.target
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
        min={min || '0'}
        max={max || '100'}
        step={step}
        className="w-full focus:outline-none"
        onChange={handleSliderChange}
        value={value}
      ></input>
    </>
  )
}

export default Slider
