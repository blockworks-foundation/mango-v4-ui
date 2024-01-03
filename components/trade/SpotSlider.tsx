import {
  MangoAccount,
  PerpMarket,
  Serum3Market,
} from '@blockworks-foundation/mango-v4'
import LeverageSlider from '@components/shared/LeverageSlider'
import mangoStore from '@store/mangoStore'
import useMangoAccount from 'hooks/useMangoAccount'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useCallback, useMemo } from 'react'
import { GenericMarket } from 'types'
import { floorToDecimal, getDecimalCount } from 'utils/numbers'

export const useSpotMarketMax = (
  mangoAccount: MangoAccount | undefined,
  selectedMarket: GenericMarket | undefined,
  side: string,
  useMargin: boolean,
) => {
  const spotBalances = mangoStore((s) => s.mangoAccount.spotBalances)
  const max = useMemo(() => {
    const group = mangoStore.getState().group
    if (!mangoAccount || !group || !selectedMarket) return 0
    if (!(selectedMarket instanceof Serum3Market)) return 0

    let leverageMax = 0
    let spotMax = 0
    try {
      const market = group.getSerum3ExternalMarket(
        selectedMarket.serumMarketExternal,
      )
      if (side === 'buy') {
        const quoteBank = group.getFirstBankByTokenIndex(
          selectedMarket.quoteTokenIndex,
        )
        const balance = mangoAccount.getTokenBalanceUi(quoteBank)
        const quoteLeverageMax = mangoAccount.getMaxQuoteForSerum3BidUi(
          group,
          selectedMarket.serumMarketExternal,
        )
        const unsettled =
          spotBalances[quoteBank?.mint.toString()]?.unsettled || 0
        const tickDecimals = getDecimalCount(market.tickSize)
        const roundedBalanceMax = floorToDecimal(
          balance + unsettled,
          tickDecimals,
        ).toNumber()
        spotMax = roundedBalanceMax

        const isReduceOnly = quoteBank?.areBorrowsReduceOnly()
        if (isReduceOnly) {
          leverageMax = roundedBalanceMax
        } else {
          leverageMax = quoteLeverageMax
        }
      } else {
        const baseBank = group.getFirstBankByTokenIndex(
          selectedMarket.baseTokenIndex,
        )
        const baseLeverageMax = mangoAccount.getMaxBaseForSerum3AskUi(
          group,
          selectedMarket.serumMarketExternal,
        )
        const balance = mangoAccount.getTokenBalanceUi(baseBank)
        const unsettled =
          spotBalances[baseBank?.mint.toString()]?.unsettled || 0
        const minOrderDecimals = getDecimalCount(market.minOrderSize)
        const roundedBalanceMax = floorToDecimal(
          balance + unsettled,
          minOrderDecimals,
        ).toNumber()
        spotMax = roundedBalanceMax

        const isReduceOnly = baseBank?.areBorrowsReduceOnly()
        if (isReduceOnly) {
          leverageMax = roundedBalanceMax
        } else {
          leverageMax = baseLeverageMax
        }
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
  isTriggerOrder,
}: {
  minOrderDecimals: number
  tickDecimals: number
  step: number
  useMargin: boolean
  isTriggerOrder: boolean
}) => {
  const { baseSize, quoteSize, side } = mangoStore((s) => s.tradeForm)
  const { selectedMarket, price: marketPrice } = useSelectedMarket()
  const { mangoAccount } = useMangoAccount()
  const standardOrderMax = useSpotMarketMax(
    mangoAccount,
    selectedMarket,
    side,
    useMargin,
  )

  const max = useMemo(() => {
    if (!isTriggerOrder) return standardOrderMax
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const { group } = mangoStore.getState()
    if (
      !group ||
      !mangoAccount ||
      !selectedMarket ||
      selectedMarket instanceof PerpMarket
    )
      return 0
    const positionBank = group.getFirstBankByTokenIndex(
      selectedMarket.baseTokenIndex,
    )
    let max = 0
    const balance = mangoAccount.getTokenBalanceUi(positionBank)
    const roundedBalance = floorToDecimal(balance, minOrderDecimals).toNumber()
    if (side === 'buy') {
      max = roundedBalance < 0 ? roundedBalance : 0
    } else {
      max = roundedBalance > 0 ? roundedBalance : 0
    }
    return Math.abs(max)
  }, [isTriggerOrder, selectedMarket, side, standardOrderMax])

  const handleSlide = useCallback(
    (val: string) => {
      const set = mangoStore.getState().set

      set((s) => {
        const price =
          s.tradeForm.tradeType === 'Market'
            ? marketPrice
            : Number(s.tradeForm.price)
        if (isTriggerOrder) {
          const baseSize = floorToDecimal(parseFloat(val), minOrderDecimals)
          const quoteSize = floorToDecimal(baseSize.mul(price), tickDecimals)
          s.tradeForm.baseSize = baseSize.toFixed()
          s.tradeForm.quoteSize = quoteSize.toFixed()
        } else {
          if (s.tradeForm.side === 'buy') {
            if (Number(price)) {
              const baseSize = floorToDecimal(
                parseFloat(val) / price,
                minOrderDecimals,
              )
              const quoteSize = floorToDecimal(
                baseSize.mul(price),
                tickDecimals,
              )
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
        }
      })
    },
    [marketPrice, minOrderDecimals, tickDecimals, isTriggerOrder],
  )

  return (
    <div className="w-full px-3 md:px-4">
      <LeverageSlider
        amount={
          side === 'buy' && !isTriggerOrder
            ? parseFloat(quoteSize)
            : parseFloat(baseSize)
        }
        leverageMax={max}
        onChange={handleSlide}
        step={step}
      />
    </div>
  )
}

export default SpotSlider
