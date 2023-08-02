import { MangoAccount, Serum3Market } from '@blockworks-foundation/mango-v4'
import LeverageSlider from '@components/shared/LeverageSlider'
import mangoStore from '@store/mangoStore'
import useMangoAccount from 'hooks/useMangoAccount'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useCallback, useMemo } from 'react'
import { GenericMarket } from 'types'
import { floorToDecimal } from 'utils/numbers'

export const useSpotMarketMax = (
  mangoAccount: MangoAccount | undefined,
  selectedMarket: GenericMarket | undefined,
  side: string,
  useMargin: boolean,
) => {
  const spotBalances = mangoStore((s) => s.mangoAccount.spotBalances)
  const max = useMemo(() => {
    const group = mangoStore.getState().group
    if (!mangoAccount || !group || !selectedMarket) return 100
    if (!(selectedMarket instanceof Serum3Market)) return 100

    let leverageMax = 0
    let spotMax = 0
    try {
      if (side === 'buy') {
        leverageMax = mangoAccount.getMaxQuoteForSerum3BidUi(
          group,
          selectedMarket.serumMarketExternal,
        )
        const bank = group.getFirstBankByTokenIndex(
          selectedMarket.quoteTokenIndex,
        )
        const balance = mangoAccount.getTokenBalanceUi(bank)
        const unsettled = spotBalances[bank.mint.toString()]?.unsettled || 0
        spotMax = balance + unsettled
      } else {
        leverageMax = mangoAccount.getMaxBaseForSerum3AskUi(
          group,
          selectedMarket.serumMarketExternal,
        )
        const bank = group.getFirstBankByTokenIndex(
          selectedMarket.baseTokenIndex,
        )
        const balance = mangoAccount.getTokenBalanceUi(bank)
        const unsettled = spotBalances[bank.mint.toString()]?.unsettled || 0
        spotMax = balance + unsettled
      }
      return useMargin ? leverageMax : Math.max(spotMax, 0)
    } catch (e) {
      console.error('Error calculating max size: ', e)
      return 0
    }
  }, [side, selectedMarket, mangoAccount, useMargin])

  return max
}

const SpotSlider = ({
  minOrderDecimals,
  tickDecimals,
  step,
  useMargin,
}: {
  minOrderDecimals: number
  tickDecimals: number
  step: number
  useMargin: boolean
}) => {
  const side = mangoStore((s) => s.tradeForm.side)
  const { selectedMarket, price: marketPrice } = useSelectedMarket()
  const { mangoAccount } = useMangoAccount()
  const tradeForm = mangoStore((s) => s.tradeForm)
  const max = useSpotMarketMax(mangoAccount, selectedMarket, side, useMargin)

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
        leverageMax={max}
        onChange={handleSlide}
        step={step}
      />
    </div>
  )
}

export default SpotSlider
