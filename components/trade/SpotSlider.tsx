import { Serum3Market } from '@blockworks-foundation/mango-v4'
import LeverageSlider from '@components/shared/LeverageSlider'
import mangoStore from '@store/mangoStore'
import useMangoAccount from 'hooks/useMangoAccount'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useCallback, useMemo } from 'react'
// import { notify } from 'utils/notifications'

const SpotSlider = () => {
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
      // notify({
      //   type: 'error',
      //   title: 'Error calculating max leverage.',
      // })
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
            s.tradeForm.baseSize = (parseFloat(val) / price).toString()
          } else {
            s.tradeForm.baseSize = ''
          }
        } else if (s.tradeForm.side === 'sell') {
          s.tradeForm.baseSize = val
          if (Number(price)) {
            s.tradeForm.quoteSize = (parseFloat(val) * price).toString()
          }
        }
      })
    },
    [marketPrice]
  )

  return (
    <div className="w-full px-4">
      <LeverageSlider
        amount={
          tradeForm.side === 'buy'
            ? parseFloat(tradeForm.quoteSize)
            : parseFloat(tradeForm.baseSize)
        }
        leverageMax={leverageMax}
        onChange={handleSlide}
        step={0.01}
      />
    </div>
  )
}

export default SpotSlider
