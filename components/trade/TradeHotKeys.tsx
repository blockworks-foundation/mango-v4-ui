import {
  Group,
  MangoAccount,
  PerpMarket,
  PerpOrderSide,
  PerpOrderType,
  Serum3Market,
  Serum3OrderType,
  Serum3SelfTradeBehavior,
  Serum3Side,
} from '@blockworks-foundation/mango-v4'
import { HotKey } from '@components/settings/HotKeysSettings'
import mangoStore from '@store/mangoStore'
import { ReactNode, useCallback } from 'react'
import { GenericMarket, isMangoError } from 'types'
import { SOUND_SETTINGS_KEY } from 'utils/constants'
import { notify } from 'utils/notifications'
import { calculateLimitPriceForMarketOrder } from 'utils/tradeForm'
import { successSound } from './AdvancedTradeForm'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { INITIAL_SOUND_SETTINGS } from '@components/settings/SoundSettings'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { floorToDecimal, getDecimalCount } from 'utils/numbers'
import { useTranslation } from 'next-i18next'
import { useCustomHotkeys } from 'hooks/useCustomHotKeys'
import { HOTKEY_TEMPLATES } from '@components/modals/HotKeyModal'
import { handleCloseAll } from './CloseAllPositionsModal'

const set = mangoStore.getState().set

const calcBaseSize = (
  orderDetails: HotKey,
  maxSize: number,
  oraclePrice: number,
  quoteTokenIndex: number,
  group: Group,
  limitPrice?: number,
) => {
  const { orderSize, orderSide, orderSizeType, orderType } = orderDetails
  let baseSize: number
  let quoteSize: number
  if (orderSide === 'buy') {
    // assumes USDC = $1 as tokenIndex is 0
    if (!quoteTokenIndex) {
      quoteSize =
        orderSizeType === 'percentage'
          ? (Number(orderSize) / 100) * maxSize
          : Number(orderSize)
    } else {
      // required for non USDC quote tokens
      const quoteBank = group.getFirstBankByTokenIndex(quoteTokenIndex)
      const quotePrice = quoteBank.uiPrice
      const orderSizeInQuote = Number(orderSize) / quotePrice
      quoteSize =
        orderSizeType === 'percentage'
          ? (orderSizeInQuote / 100) * maxSize
          : orderSizeInQuote
    }
    if (orderType === 'market') {
      baseSize = quoteSize / oraclePrice
    } else {
      const price = limitPrice ? limitPrice : 0
      baseSize = quoteSize / price
    }
  } else {
    if (orderSizeType === 'percentage') {
      baseSize = (Number(orderSize) / 100) * maxSize
    } else {
      if (orderType === 'market') {
        baseSize = Number(orderSize) / oraclePrice
      } else {
        const price = limitPrice ? limitPrice : 0
        baseSize = Number(orderSize) / price
      }
    }
  }
  return baseSize
}

const calcSpotMarketMax = (
  mangoAccount: MangoAccount | undefined,
  selectedMarket: GenericMarket | undefined,
  side: string,
  useMargin: boolean,
) => {
  const spotBalances = mangoStore.getState().mangoAccount.spotBalances
  const group = mangoStore.getState().group
  if (!mangoAccount || !group || !selectedMarket) return 0
  if (!(selectedMarket instanceof Serum3Market)) return 0

  let leverageMax = 0
  let spotMax = 0
  try {
    const isBuySide = side === 'buy'
    leverageMax = mangoAccount[
      isBuySide ? 'getMaxQuoteForSerum3BidUi' : 'getMaxBaseForSerum3AskUi'
    ](group, selectedMarket.serumMarketExternal)
    const bank = group.getFirstBankByTokenIndex(
      isBuySide
        ? selectedMarket.quoteTokenIndex
        : selectedMarket.baseTokenIndex,
    )
    const balance = mangoAccount.getTokenBalanceUi(bank)
    const unsettled = spotBalances[bank.mint.toString()]?.unsettled || 0
    spotMax = balance + unsettled
    return useMargin ? leverageMax : Math.max(spotMax, 0)
  } catch (e) {
    console.error('Error calculating max size: ', e)
    return 0
  }
}

const calcPerpMax = (
  mangoAccount: MangoAccount,
  selectedMarket: GenericMarket,
  side: string,
) => {
  const group = mangoStore.getState().group
  if (
    !mangoAccount ||
    !group ||
    !selectedMarket ||
    selectedMarket instanceof Serum3Market
  )
    return 0
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

const TradeHotKeys = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation(['common', 'settings', 'trade'])
  const { price: oraclePrice, serumOrPerpMarket } = useSelectedMarket()
  const [soundSettings] = useLocalStorageState(
    SOUND_SETTINGS_KEY,
    INITIAL_SOUND_SETTINGS,
  )

  const handleHotKeyPress = (hkOrder: HotKey) => {
    if (hkOrder.custom === HOTKEY_TEMPLATES.CLOSE_ALL_PERP) {
      notify({
        type: 'info',
        title: t('trade:placing-order'),
        description: hkOrder.custom,
      })
      handleCloseAll()
    } else {
      handlePlaceOrder(hkOrder)
    }
  }

  const handlePlaceOrder = useCallback(
    async (hkOrder: HotKey) => {
      const client = mangoStore.getState().client
      const group = mangoStore.getState().group
      const mangoAccount = mangoStore.getState().mangoAccount.current
      const actions = mangoStore.getState().actions
      const selectedMarket = mangoStore.getState().selectedMarket.current
      const {
        custom,
        ioc,
        orderPrice,
        orderSide,
        orderType,
        postOnly,
        reduceOnly,
        margin,
      } = hkOrder

      if (!group || !mangoAccount || !serumOrPerpMarket || !selectedMarket)
        return
      try {
        let baseSize: number
        let price: number

        if (
          custom === HOTKEY_TEMPLATES.CLOSE_LONG ||
          custom === HOTKEY_TEMPLATES.CLOSE_SHORT
        ) {
          if (selectedMarket instanceof Serum3Market) {
            const baseBank = group.getFirstBankByTokenIndex(
              selectedMarket.baseTokenIndex,
            )
            const baseBalance = mangoAccount.getTokenBalanceUi(baseBank)
            baseSize = baseBalance
          } else {
            const position = mangoAccount.getPerpPosition(
              selectedMarket.perpMarketIndex,
            )
            const rawBaseSize = position?.getBasePositionUi(selectedMarket)
            if (rawBaseSize) {
              // increase size to make sure position is fully closed (reduceOnly is enabled)
              baseSize = rawBaseSize * 2
            } else {
              notify({
                type: 'error',
                title: t('settings:error-no-position'),
              })
              return
            }
          }

          // check correct side for close
          if (custom === HOTKEY_TEMPLATES.CLOSE_LONG && baseSize < 0) {
            notify({
              type: 'error',
              title: t('settings:error-no-long'),
            })
            return
          }
          if (custom === HOTKEY_TEMPLATES.CLOSE_SHORT && baseSize > 0) {
            notify({
              type: 'error',
              title: t('settings:error-no-short'),
            })
            return
          }

          const orderbook = mangoStore.getState().selectedMarket.orderbook
          price = calculateLimitPriceForMarketOrder(
            orderbook,
            baseSize,
            orderSide,
          )
        } else {
          const orderMax =
            serumOrPerpMarket instanceof PerpMarket
              ? calcPerpMax(mangoAccount, selectedMarket, orderSide)
              : calcSpotMarketMax(
                  mangoAccount,
                  selectedMarket,
                  orderSide,
                  margin,
                )
          const quoteTokenIndex =
            selectedMarket instanceof PerpMarket
              ? 0
              : selectedMarket.quoteTokenIndex

          if (orderType === 'market') {
            baseSize = calcBaseSize(
              hkOrder,
              orderMax,
              oraclePrice,
              quoteTokenIndex,
              group,
            )
            const orderbook = mangoStore.getState().selectedMarket.orderbook
            price = calculateLimitPriceForMarketOrder(
              orderbook,
              Math.abs(baseSize),
              orderSide,
            )
          } else {
            // change in price from oracle for limit order
            const priceChange = (Number(orderPrice) / 100) * oraclePrice
            // subtract price change for buy limit, add for sell limit
            const rawPrice =
              orderSide === 'buy'
                ? oraclePrice - priceChange
                : oraclePrice + priceChange
            price = floorToDecimal(
              rawPrice,
              getDecimalCount(serumOrPerpMarket.tickSize),
            ).toNumber()
            baseSize = calcBaseSize(
              hkOrder,
              orderMax,
              oraclePrice,
              quoteTokenIndex,
              group,
              price,
            )
          }
        }

        const formattedSize = floorToDecimal(
          Math.abs(baseSize),
          getDecimalCount(serumOrPerpMarket.minOrderSize),
        ).toNumber()

        // check if size > min order size
        if (formattedSize < serumOrPerpMarket.minOrderSize) {
          notify({
            type: 'error',
            title: t('settings:error-order-less-than-min'),
          })
          return
        }

        notify({
          type: 'info',
          title: t('trade:placing-order'),
          description: custom
            ? custom
            : `${t(orderSide)} ${formattedSize} ${selectedMarket.name} ${
                orderType === 'limit'
                  ? `${t('settings:at')} ${price}`
                  : `${t('settings:at')} ${t('market')}`
              }`,
        })

        if (selectedMarket instanceof Serum3Market) {
          const spotOrderType = ioc
            ? Serum3OrderType.immediateOrCancel
            : postOnly && orderType !== 'market'
            ? Serum3OrderType.postOnly
            : Serum3OrderType.limit

          const tx = await client.serum3PlaceOrder(
            group,
            mangoAccount,
            selectedMarket.serumMarketExternal,
            orderSide === 'buy' ? Serum3Side.bid : Serum3Side.ask,
            price,
            formattedSize,
            Serum3SelfTradeBehavior.decrementTake,
            spotOrderType,
            Date.now(),
            10,
          )
          actions.fetchOpenOrders(true)
          set((s) => {
            s.successAnimation.trade = true
          })
          if (soundSettings['swap-success']) {
            successSound.play()
          }
          notify({
            type: 'success',
            title: 'Transaction successful',
            txid: tx.signature,
          })
        } else if (selectedMarket instanceof PerpMarket) {
          const perpOrderType =
            orderType === 'market'
              ? PerpOrderType.market
              : ioc
              ? PerpOrderType.immediateOrCancel
              : postOnly
              ? PerpOrderType.postOnly
              : PerpOrderType.limit

          const tx = await client.perpPlaceOrder(
            group,
            mangoAccount,
            selectedMarket.perpMarketIndex,
            orderSide === 'buy' ? PerpOrderSide.bid : PerpOrderSide.ask,
            price,
            formattedSize,
            undefined, // maxQuoteQuantity
            Date.now(),
            perpOrderType,
            selectedMarket.reduceOnly || reduceOnly,
            undefined,
            undefined,
          )
          actions.fetchOpenOrders(true)
          set((s) => {
            s.successAnimation.trade = true
          })
          if (soundSettings['swap-success']) {
            successSound.play()
          }
          notify({
            type: 'success',
            title: 'Transaction successful',
            txid: tx.signature,
          })
        }
      } catch (e) {
        console.error('Place trade error:', e)
        if (!isMangoError(e)) return
        notify({
          title: 'There was an issue.',
          description: e.message,
          txid: e?.txid,
          type: 'error',
        })
      }
    },
    [serumOrPerpMarket],
  )

  useCustomHotkeys(handleHotKeyPress)

  return <>{children}</>
}

export default TradeHotKeys
