import { Serum3Market } from '@blockworks-foundation/mango-v4'
import LeverageSlider from '@components/swap/LeverageSlider'
import mangoStore from '@store/mangoStore'
import Decimal from 'decimal.js'
import { useCallback, useMemo } from 'react'
import { notify } from 'utils/notifications'

const SpotSlider = () => {
  const side = mangoStore((s) => s.tradeForm.side)
  const selectedMarket = mangoStore((s) => s.selectedMarket.current)
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)
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
      console.error('SpotSlider: ', e)
      notify({
        type: 'error',
        title: 'Error calculating max leverage.',
      })
      return 0
    }
  }, [side, selectedMarket, mangoAccount])

  const handleSlide = useCallback((val: string) => {
    const set = mangoStore.getState().set

    set((s) => {
      if (s.tradeForm.side === 'buy') {
        s.tradeForm.quoteSize = val

        if (Number(s.tradeForm.price)) {
          s.tradeForm.baseSize = (
            parseFloat(val) / parseFloat(s.tradeForm.price)
          ).toString()
        } else {
          s.tradeForm.baseSize = ''
        }
      } else if (s.tradeForm.side === 'sell') {
        s.tradeForm.baseSize = val

        if (Number(s.tradeForm.price)) {
          s.tradeForm.quoteSize = (
            parseFloat(val) * parseFloat(s.tradeForm.price)
          ).toString()
        }
      }
    })
  }, [])

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
      />
    </div>
  )
}

export default SpotSlider
