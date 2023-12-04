import { PerpMarket, Serum3Market } from '@blockworks-foundation/mango-v4'
import MaxAmountButton from '@components/shared/MaxAmountButton'
import { FadeInFadeOut } from '@components/shared/Transitions'
import { useWallet } from '@solana/wallet-adapter-react'
import mangoStore from '@store/mangoStore'
import useMangoAccount from 'hooks/useMangoAccount'
import useSelectedMarket from 'hooks/useSelectedMarket'
import useUnownedAccount from 'hooks/useUnownedAccount'
import { useTranslation } from 'next-i18next'
import { useCallback, useMemo } from 'react'
import { floorToDecimal } from 'utils/numbers'
import { useSpotMarketMax, useSpotMarketWalletMax } from './SpotSlider'

const MaxSizeButton = ({
  minOrderDecimals,
  tickDecimals,
  useMargin,
  large,
}: {
  minOrderDecimals: number
  tickDecimals: number
  useMargin: boolean
  large?: boolean
}) => {
  const { t } = useTranslation(['common', 'trade'])
  const { mangoAccount } = useMangoAccount()
  const { selectedMarket, price: oraclePrice } = useSelectedMarket()
  const { price, side, tradeType } = mangoStore((s) => s.tradeForm)
  const spotMax = useSpotMarketMax(
    mangoAccount,
    selectedMarket,
    side,
    useMargin,
  )
  const walletOrderMax = useSpotMarketWalletMax(selectedMarket, side)
  const { isUnownedAccount } = useUnownedAccount()
  const { connected } = useWallet()

  const perpMax = useMemo(() => {
    const group = mangoStore.getState().group
    if (!mangoAccount || !group || !selectedMarket) return 0
    if (selectedMarket instanceof PerpMarket) {
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
        console.error('Error calculating max leverage: spot btn group: ', e)
        return 0
      }
    }
  }, [mangoAccount, side, selectedMarket])

  const handleMax = useCallback(() => {
    let max: number
    if (selectedMarket instanceof Serum3Market) {
      max = spotMax ? spotMax : walletOrderMax
    } else max = perpMax ? perpMax : 0
    // const max = selectedMarket instanceof Serum3Market ? spotMax : perpMax || 0
    const set = mangoStore.getState().set
    set((state) => {
      if (side === 'buy') {
        if (tradeType === 'Market' || !price) {
          const baseSize = floorToDecimal(max / oraclePrice, minOrderDecimals)
          const quoteSize = floorToDecimal(max, tickDecimals)
          state.tradeForm.baseSize = baseSize.toFixed()
          state.tradeForm.quoteSize = quoteSize.toFixed()
        } else {
          const baseSize = floorToDecimal(
            max / parseFloat(price),
            minOrderDecimals,
          )
          const quoteSize = floorToDecimal(baseSize.mul(price), tickDecimals)
          state.tradeForm.baseSize = baseSize.toFixed()
          state.tradeForm.quoteSize = quoteSize.toFixed()
        }
      } else {
        const baseSize = floorToDecimal(max, minOrderDecimals)
        if (tradeType === 'Market' || !price) {
          const quoteSize = floorToDecimal(
            baseSize.mul(oraclePrice),
            tickDecimals,
          )
          state.tradeForm.baseSize = baseSize.toFixed()
          state.tradeForm.quoteSize = quoteSize.toFixed()
        } else {
          const quoteSize = floorToDecimal(baseSize.mul(price), tickDecimals)
          state.tradeForm.baseSize = baseSize.toFixed()
          state.tradeForm.quoteSize = quoteSize.toFixed()
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
    walletOrderMax,
  ])

  const maxAmount = useMemo(() => {
    let max: number
    if (selectedMarket instanceof Serum3Market) {
      max = spotMax ? spotMax : walletOrderMax
    } else max = perpMax ? perpMax : 0
    const tradePrice = tradeType === 'Market' ? oraclePrice : Number(price)
    if (side === 'buy') {
      return max / tradePrice
    } else {
      return max
    }
  }, [perpMax, spotMax, selectedMarket, price, side, tradeType, walletOrderMax])

  return (
    <FadeInFadeOut show={!!price && !isUnownedAccount && connected}>
      <MaxAmountButton
        className={large ? 'text-sm' : 'text-xs'}
        decimals={minOrderDecimals}
        label={t('max')}
        onClick={handleMax}
        value={maxAmount}
      />
    </FadeInFadeOut>
  )
}

export default MaxSizeButton
