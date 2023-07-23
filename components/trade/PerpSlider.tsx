import { PerpMarket } from '@blockworks-foundation/mango-v4'
import LeverageSlider from '@components/shared/LeverageSlider'
import mangoStore from '@store/mangoStore'
import BN from 'bn.js'
import useMangoAccount from 'hooks/useMangoAccount'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useCallback, useMemo } from 'react'
import { floorToDecimal } from 'utils/numbers'

const PerpSlider = ({
  minOrderDecimals,
  tickDecimals,
}: {
  minOrderDecimals: number
  tickDecimals: number
}) => {
  const side = mangoStore((s) => s.tradeForm.side)
  const { selectedMarket, price: marketPrice } = useSelectedMarket()
  const { mangoAccount } = useMangoAccount()
  const tradeForm = mangoStore((s) => s.tradeForm)

  const step = useMemo(() => {
    if (selectedMarket instanceof PerpMarket) {
      return selectedMarket.baseLotsToUi(new BN(1))
    }
    return 0.01
  }, [selectedMarket])

  const leverageMax = useMemo(() => {
    const group = mangoStore.getState().group
    if (!mangoAccount || !group || !selectedMarket) return 100
    if (!(selectedMarket instanceof PerpMarket)) return 100

    try {
      if (side === 'buy') {
        return mangoAccount.getMaxQuoteForPerpBidUi(
          group,
          selectedMarket.perpMarketIndex,
        )
      } else {
        return mangoAccount.getMaxBaseForPerpAskUi(
          group,
          selectedMarket.perpMarketIndex,
        )
      }
    } catch (e) {
      console.error('Error calculating max leverage for PerpSlider: ', e)
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
          if (Number(price)) {
            const baseSize = floorToDecimal(
              parseFloat(val) / price,
              minOrderDecimals,
            )
            const quoteSize = floorToDecimal(baseSize.mul(price), tickDecimals)
            s.tradeForm.baseSize = baseSize.toFixed()
            s.tradeForm.quoteSize = quoteSize.toFixed()
          } else {
            s.tradeForm.baseSize = ''
            s.tradeForm.quoteSize = val
          }
        } else if (s.tradeForm.side === 'sell') {
          s.tradeForm.baseSize = val
          if (Number(price)) {
            s.tradeForm.quoteSize = floorToDecimal(
              parseFloat(val) * price,
              tickDecimals,
            ).toFixed()
          }
        }
      })
    },
    [marketPrice, minOrderDecimals, tickDecimals],
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

export default PerpSlider
