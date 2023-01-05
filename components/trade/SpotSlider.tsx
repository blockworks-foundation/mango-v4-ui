import { Serum3Market } from '@blockworks-foundation/mango-v4'
import LeverageSlider from '@components/shared/LeverageSlider'
import mangoStore from '@store/mangoStore'
import useMangoAccount from 'hooks/useMangoAccount'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useCallback, useMemo } from 'react'
import { trimDecimals } from 'utils/numbers'

const SpotSlider = ({
  minOrderDecimals,
  tickDecimals,
  step,
}: {
  minOrderDecimals: number
  tickDecimals: number
  step: number
}) => {
  const side = mangoStore((s) => s.tradeForm.side)
  const { selectedMarket, price: marketPrice } = useSelectedMarket()
  const { mangoAccount } = useMangoAccount()
  const tradeForm = mangoStore((s) => s.tradeForm)

  const leverageMax = useMemo(() => {
    const group = mangoStore.getState().group
    if (!mangoAccount || !group || !selectedMarket) return 100
    if (!(selectedMarket instanceof Serum3Market)) return 100

    try {
      if (side === 'buy') {
        return mangoAccount.getMaxQuoteForSerum3BidUi(
          group,
          selectedMarket.serumMarketExternal
        )
      } else {
        return mangoAccount.getMaxBaseForSerum3AskUi(
          group,
          selectedMarket.serumMarketExternal
        )
      }
    } catch (e) {
      console.error('Error calculating max leverage for spot slider: ', e)
      return 0
    }
  }, [side, selectedMarket, mangoAccount])

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
    <div className="w-full px-3 md:px-4">
      <LeverageSlider
        amount={
          tradeForm.side === 'buy'
            ? parseFloat(tradeForm.quoteSize)
            : parseFloat(tradeForm.baseSize)
        }
        leverageMax={leverageMax}
        onChange={handleSlide}
        step={step}
      />
    </div>
  )
}

export default SpotSlider
