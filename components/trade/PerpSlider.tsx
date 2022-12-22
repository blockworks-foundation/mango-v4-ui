import { PerpMarket } from '@blockworks-foundation/mango-v4'
import LeverageSlider from '@components/shared/LeverageSlider'
import mangoStore from '@store/mangoStore'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useCallback, useMemo } from 'react'
import { trimDecimals } from 'utils/numbers'

const PerpSlider = ({
  max,
  minOrderDecimals,
  tickDecimals,
}: {
  max: number
  minOrderDecimals: number
  tickDecimals: number
}) => {
  const { selectedMarket, price: marketPrice } = useSelectedMarket()
  const tradeForm = mangoStore((s) => s.tradeForm)

  const step = useMemo(() => {
    if (selectedMarket instanceof PerpMarket) {
      return selectedMarket.baseLotsToUi(BigInt(1) as any)
    }
    return 0.01
  }, [selectedMarket])

  const handleSlide = useCallback(
    (val: string) => {
      const set = mangoStore.getState().set

      set((s) => {
        const price =
          s.tradeForm.tradeType === 'Market'
            ? marketPrice
            : Number(s.tradeForm.price)

        if (s.tradeForm.side === 'buy') {
          s.tradeForm.quoteSize = val
          if (Number(price)) {
            s.tradeForm.baseSize = trimDecimals(
              parseFloat(val) / price,
              minOrderDecimals
            ).toFixed(minOrderDecimals)
          } else {
            s.tradeForm.baseSize = ''
          }
        } else if (s.tradeForm.side === 'sell') {
          s.tradeForm.baseSize = val
          if (Number(price)) {
            s.tradeForm.quoteSize = trimDecimals(
              parseFloat(val) * price,
              tickDecimals
            ).toFixed(tickDecimals)
          }
        }
      })
    },
    [marketPrice, minOrderDecimals, tickDecimals]
  )

  return (
    <div className="w-full px-4">
      <LeverageSlider
        amount={
          tradeForm.side === 'buy'
            ? parseFloat(tradeForm.quoteSize)
            : parseFloat(tradeForm.baseSize)
        }
        leverageMax={max}
        onChange={handleSlide}
        step={step}
      />
    </div>
  )
}

export default PerpSlider
