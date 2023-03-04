import { PerpMarket, Serum3Market } from '@blockworks-foundation/mango-v4'
import MaxAmountButton from '@components/shared/MaxAmountButton'
import { FadeInFadeOut } from '@components/shared/Transitions'
import mangoStore from '@store/mangoStore'
import useMangoAccount from 'hooks/useMangoAccount'
import useSelectedMarket from 'hooks/useSelectedMarket'
import useUnownedAccount from 'hooks/useUnownedAccount'
import { useTranslation } from 'next-i18next'
import { useCallback, useMemo } from 'react'
import { formatNumericValue } from 'utils/numbers'
import { useSpotMarketMax } from './SpotSlider'

const MaxSizeButton = ({
  minOrderDecimals,
  tickDecimals,
  useMargin,
}: {
  minOrderDecimals: number
  tickDecimals: number
  useMargin: boolean
}) => {
  const { t } = useTranslation(['common', 'trade'])
  const { mangoAccount } = useMangoAccount()
  const { selectedMarket, price: oraclePrice } = useSelectedMarket()
  const { price, side, tradeType } = mangoStore((s) => s.tradeForm)
  const spotMax = useSpotMarketMax(
    mangoAccount,
    selectedMarket,
    side,
    useMargin
  )
  const { isUnownedAccount } = useUnownedAccount()

  const perpMax = useMemo(() => {
    const group = mangoStore.getState().group
    if (!mangoAccount || !group || !selectedMarket) return 0
    if (selectedMarket instanceof PerpMarket) {
      try {
        if (side === 'buy') {
          return mangoAccount.getMaxQuoteForPerpBidUi(
            group,
            selectedMarket.perpMarketIndex
          )
        } else {
          return mangoAccount.getMaxBaseForPerpAskUi(
            group,
            selectedMarket.perpMarketIndex
          )
        }
      } catch (e) {
        console.error('Error calculating max leverage: spot btn group: ', e)
        return 0
      }
    }
  }, [mangoAccount, side, selectedMarket])

  const handleMax = useCallback(() => {
    const max = selectedMarket instanceof Serum3Market ? spotMax : perpMax || 0
    const set = mangoStore.getState().set
    set((state) => {
      if (side === 'buy') {
        state.tradeForm.quoteSize = formatNumericValue(max, tickDecimals)
        if (tradeType === 'Market' || !price) {
          state.tradeForm.baseSize = formatNumericValue(
            max / oraclePrice,
            minOrderDecimals
          )
        } else {
          state.tradeForm.baseSize = formatNumericValue(
            max / parseFloat(price),
            minOrderDecimals
          )
        }
      } else {
        state.tradeForm.baseSize = formatNumericValue(max, minOrderDecimals)
        if (tradeType === 'Market' || !price) {
          state.tradeForm.quoteSize = formatNumericValue(
            max * oraclePrice,
            minOrderDecimals
          )
        } else {
          state.tradeForm.quoteSize = formatNumericValue(
            max * parseFloat(price),
            minOrderDecimals
          )
        }
      }
    })
  }, [
    minOrderDecimals,
    perpMax,
    price,
    selectedMarket,
    side,
    spotMax,
    tickDecimals,
    tradeType,
  ])

  const maxAmount = useMemo(() => {
    const max = selectedMarket instanceof Serum3Market ? spotMax : perpMax || 0
    const tradePrice = tradeType === 'Market' ? oraclePrice : Number(price)
    if (side === 'buy') {
      return max / tradePrice
    } else {
      return max
    }
  }, [perpMax, spotMax, selectedMarket, price, side, tradeType])

  return (
    <div className="mb-2 mt-3 flex items-center justify-between">
      <p className="text-xs text-th-fgd-3">{t('trade:size')}</p>
      <FadeInFadeOut show={!!price && !isUnownedAccount}>
        <MaxAmountButton
          className="text-xs"
          decimals={minOrderDecimals}
          label={t('max')}
          onClick={handleMax}
          value={maxAmount}
        />
      </FadeInFadeOut>
    </div>
  )
}

export default MaxSizeButton
