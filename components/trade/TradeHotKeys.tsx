import {
  Group,
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
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import Hotkeys from 'react-hot-keys'
import { isMangoError } from 'types'
import { HOT_KEYS_KEY, SOUND_SETTINGS_KEY } from 'utils/constants'
import { notify } from 'utils/notifications'
import { calculateLimitPriceForMarketOrder } from 'utils/tradeForm'
import { successSound } from './AdvancedTradeForm'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { INITIAL_SOUND_SETTINGS } from '@components/settings/SoundSettings'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { floorToDecimal, getDecimalCount } from 'utils/numbers'
import { useSpotMarketMax } from './SpotSlider'
import useMangoAccount from 'hooks/useMangoAccount'
import { Market } from '@project-serum/serum'
import { useRouter } from 'next/router'
import useUnownedAccount from 'hooks/useUnownedAccount'

const set = mangoStore.getState().set

const calcBaseSize = (
  orderDetails: HotKey,
  maxSize: number,
  market: PerpMarket | Market,
  oraclePrice: number,
  quoteTokenIndex: number,
  group: Group,
  limitPrice?: number
) => {
  const { orderSize, orderSide, orderSizeType, orderType } = orderDetails
  let quoteSize: number
  if (!quoteTokenIndex) {
    quoteSize =
      orderSizeType === 'percentage'
        ? (Number(orderSize) / 100) * maxSize
        : Number(orderSize)
  } else {
    const quoteBank = group.getFirstBankByTokenIndex(quoteTokenIndex)
    const quotePrice = quoteBank.uiPrice
    const orderSizeInQuote = Number(orderSize) / quotePrice
    quoteSize =
      orderSizeType === 'percentage'
        ? (orderSizeInQuote / 100) * maxSize
        : orderSizeInQuote
  }

  let baseSize: number
  if (orderType === 'market') {
    if (orderSide === 'buy') {
      baseSize = floorToDecimal(
        quoteSize / oraclePrice,
        getDecimalCount(market.minOrderSize)
      ).toNumber()
    } else {
      if (orderSizeType === 'percentage') {
        baseSize = floorToDecimal(
          (Number(orderSize) / 100) * maxSize,
          getDecimalCount(market.minOrderSize)
        ).toNumber()
      } else {
        baseSize = floorToDecimal(
          Number(orderSize) / oraclePrice,
          getDecimalCount(market.minOrderSize)
        ).toNumber()
      }
    }
  } else {
    const price = limitPrice ? limitPrice : 0
    baseSize = floorToDecimal(
      quoteSize / price,
      getDecimalCount(market.minOrderSize)
    ).toNumber()
  }
  return baseSize
}

const TradeHotKeys = ({ children }: { children: ReactNode }) => {
  const {
    price: oraclePrice,
    selectedMarket,
    serumOrPerpMarket,
  } = useSelectedMarket()
  const { mangoAccount, mangoAccountAddress } = useMangoAccount()
  const { isUnownedAccount } = useUnownedAccount()
  const { asPath } = useRouter()
  const [hotKeys] = useLocalStorageState(HOT_KEYS_KEY, [])
  const [placingOrder, setPlacingOrder] = useState(false)
  const [useMargin, setUseMargin] = useState(false)
  const [side, setSide] = useState('buy')
  const [soundSettings] = useLocalStorageState(
    SOUND_SETTINGS_KEY,
    INITIAL_SOUND_SETTINGS
  )
  const spotMax = useSpotMarketMax(
    mangoAccount,
    selectedMarket,
    side,
    useMargin
  )

  const perpMax = useMemo(() => {
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
          selectedMarket.perpMarketIndex
        )
      } else {
        return mangoAccount.getMaxBaseForPerpAskUi(
          group,
          selectedMarket.perpMarketIndex
        )
      }
    } catch (e) {
      console.error('Error calculating max leverage: ', e)
      return 0
    }
  }, [mangoAccount, side, selectedMarket])

  const handlePlaceOrder = useCallback(
    async (hkOrder: HotKey) => {
      const client = mangoStore.getState().client
      const group = mangoStore.getState().group
      const mangoAccount = mangoStore.getState().mangoAccount.current
      const actions = mangoStore.getState().actions
      const selectedMarket = mangoStore.getState().selectedMarket.current
      const { ioc, orderPrice, orderSide, orderType, postOnly, reduceOnly } =
        hkOrder

      if (!group || !mangoAccount || !serumOrPerpMarket || !selectedMarket)
        return
      setPlacingOrder(true)
      try {
        const orderMax =
          serumOrPerpMarket instanceof PerpMarket ? perpMax : spotMax
        const quoteTokenIndex =
          selectedMarket instanceof PerpMarket
            ? 0
            : selectedMarket.quoteTokenIndex
        let baseSize: number
        let price: number
        if (orderType === 'market') {
          baseSize = calcBaseSize(
            hkOrder,
            orderMax,
            serumOrPerpMarket,
            oraclePrice,
            quoteTokenIndex,
            group
          )
          const orderbook = mangoStore.getState().selectedMarket.orderbook
          price = calculateLimitPriceForMarketOrder(
            orderbook,
            baseSize,
            orderSide
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
            getDecimalCount(serumOrPerpMarket.tickSize)
          ).toNumber()
          baseSize = calcBaseSize(
            hkOrder,
            orderMax,
            serumOrPerpMarket,
            oraclePrice,
            quoteTokenIndex,
            group,
            price
          )
        }

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
            baseSize,
            Serum3SelfTradeBehavior.decrementTake,
            spotOrderType,
            Date.now(),
            10
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
            txid: tx,
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
          console.log('perpOrderType', perpOrderType)

          const tx = await client.perpPlaceOrder(
            group,
            mangoAccount,
            selectedMarket.perpMarketIndex,
            orderSide === 'buy' ? PerpOrderSide.bid : PerpOrderSide.ask,
            price,
            Math.abs(baseSize),
            undefined, // maxQuoteQuantity
            Date.now(),
            perpOrderType,
            selectedMarket.reduceOnly || reduceOnly,
            undefined,
            undefined
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
            txid: tx,
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
      } finally {
        setPlacingOrder(false)
      }
    },
    [perpMax, serumOrPerpMarket, spotMax]
  )

  const onKeyDown = useCallback(
    (keyName: string) => {
      console.log('sdfsdf')
      const orderDetails = hotKeys.find(
        (hk: HotKey) => hk.keySequence === keyName
      )
      if (orderDetails) {
        setUseMargin(orderDetails.margin)
        setSide(orderDetails.orderSide)
        handlePlaceOrder(orderDetails)
      }
    },
    [handlePlaceOrder, hotKeys]
  )

  useEffect(() => {
    if (placingOrder) {
      notify({
        type: 'success',
        title: 'Placing order for...',
      })
    }
  }, [placingOrder])

  const showHotKeys =
    hotKeys.length &&
    asPath.includes('/trade') &&
    mangoAccountAddress &&
    !isUnownedAccount

  return showHotKeys ? (
    <Hotkeys
      keyName={hotKeys.map((k: HotKey) => k.keySequence).toString()}
      onKeyDown={onKeyDown}
    >
      {children}
    </Hotkeys>
  ) : (
    <>{children}</>
  )
}

export default TradeHotKeys
