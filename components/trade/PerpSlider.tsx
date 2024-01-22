import { MangoAccount, PerpMarket } from '@blockworks-foundation/mango-v4'
import LeverageSlider from '@components/shared/LeverageSlider'
import mangoStore from '@store/mangoStore'
import BN from 'bn.js'
import useMangoAccount from 'hooks/useMangoAccount'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useCallback, useMemo } from 'react'
import { GenericMarket } from 'types'
import { floorToDecimal } from 'utils/numbers'

export const usePerpMarketMax = (
  mangoAccount: MangoAccount | undefined,
  selectedMarket: GenericMarket | undefined,
  side: string,
) => {
  const group = mangoStore.getState().group
  if (!mangoAccount || !group || !selectedMarket) return 0
  if (!(selectedMarket instanceof PerpMarket)) return 0

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
    console.error('Error calculating max leverage: ', e)
    return 0
  }
}

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
  const perpMax = usePerpMarketMax(mangoAccount, selectedMarket, side)

  const step = useMemo(() => {
    if (selectedMarket instanceof PerpMarket) {
      return selectedMarket.baseLotsToUi(new BN(1))
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
        leverageMax={perpMax}
        onChange={handleSlide}
        step={step}
      />
    </div>
  )
}

export default PerpSlider
