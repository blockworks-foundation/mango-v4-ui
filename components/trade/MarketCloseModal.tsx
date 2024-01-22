import {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import mangoStore from '@store/mangoStore'
import { useTranslation } from 'next-i18next'
import {
  PerpOrderSide,
  PerpOrderType,
  PerpPosition,
} from '@blockworks-foundation/mango-v4'
import Modal from '@components/shared/Modal'
import Button, { LinkButton } from '@components/shared/Button'
import { notify } from 'utils/notifications'
import Loading from '@components/shared/Loading'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { MAX_PERP_SLIPPAGE, SOUND_SETTINGS_KEY } from 'utils/constants'
import { INITIAL_SOUND_SETTINGS } from '@components/settings/SoundSettings'
import { Howl } from 'howler'
import { isMangoError } from 'types'
import { decodeBook, decodeBookL2 } from 'utils/orderbook'
import InlineNotification from '@components/shared/InlineNotification'
import { getDecimalCount } from 'utils/numbers'
import useOpenPerpPositions from 'hooks/useOpenPerpPositions'

interface MarketCloseModalProps {
  onClose: () => void
  isOpen: boolean
  position: PerpPosition
}

const set = mangoStore.getState().set

const successSound = new Howl({
  src: ['/sounds/swap-success.mp3'],
  volume: 0.5,
})

type BidsAndAsks = number[][] | null

const MarketCloseModal: FunctionComponent<MarketCloseModalProps> = ({
  onClose,
  isOpen,
  position,
}) => {
  const { t } = useTranslation(['common', 'trade'])
  const [submitting, setSubmitting] = useState(false)
  const { poolIsPerpReadyForRefresh } = useOpenPerpPositions()
  const connection = mangoStore((s) => s.connection)
  const group = mangoStore((s) => s.group)
  const [soundSettings] = useLocalStorageState(
    SOUND_SETTINGS_KEY,
    INITIAL_SOUND_SETTINGS,
  )
  const [asks, setAsks] = useState<BidsAndAsks>(null)
  const [bids, setBids] = useState<BidsAndAsks>(null)

  const perpMarket = useMemo(() => {
    return group?.getPerpMarketByMarketIndex(position.marketIndex)
  }, [group, position?.marketIndex])

  // subscribe to the bids and asks orderbook accounts
  useEffect(() => {
    console.log('setting up orderbook websockets')
    const client = mangoStore.getState().client
    if (!group || !perpMarket) return

    let bidSubscriptionId: number | undefined = undefined
    let askSubscriptionId: number | undefined = undefined
    let lastSeenBidsSlot: number
    let lastSeenAsksSlot: number
    const bidsPk = perpMarket.bids
    if (bidsPk) {
      connection
        .getAccountInfoAndContext(bidsPk)
        .then(({ context, value: info }) => {
          if (!info) return
          const decodedBook = decodeBook(client, perpMarket, info, 'bids')
          setBids(decodeBookL2(decodedBook))
          lastSeenBidsSlot = context.slot
        })
      bidSubscriptionId = connection.onAccountChange(
        bidsPk,
        (info, context) => {
          if (context.slot > lastSeenBidsSlot) {
            const decodedBook = decodeBook(client, perpMarket, info, 'bids')
            setBids(decodeBookL2(decodedBook))
          }
        },
        'processed',
      )
    }

    const asksPk = perpMarket.asks
    if (asksPk) {
      connection
        .getAccountInfoAndContext(asksPk)
        .then(({ context, value: info }) => {
          if (!info) return
          const decodedBook = decodeBook(client, perpMarket, info, 'asks')
          setAsks(decodeBookL2(decodedBook))
          lastSeenAsksSlot = context.slot
        })
      askSubscriptionId = connection.onAccountChange(
        asksPk,
        (info, context) => {
          if (context.slot > lastSeenAsksSlot) {
            const decodedBook = decodeBook(client, perpMarket, info, 'asks')
            setAsks(decodeBookL2(decodedBook))
          }
        },
        'processed',
      )
    }
    return () => {
      if (typeof bidSubscriptionId !== 'undefined') {
        connection.removeAccountChangeListener(bidSubscriptionId)
      }
      if (typeof askSubscriptionId !== 'undefined') {
        connection.removeAccountChangeListener(askSubscriptionId)
      }
    }
  }, [connection, perpMarket, group])

  const insufficientLiquidity = useMemo(() => {
    if (!perpMarket) return false
    const baseSize = position.getBasePositionUi(perpMarket)
    const side = baseSize < 0 ? 'buy' : 'sell'
    if (side === 'sell') {
      if (!bids || !bids.length) return false
      const marketPrice = Math.max(perpMarket.uiPrice, bids[0][0])
      const limitPrice = marketPrice * (1 - MAX_PERP_SLIPPAGE)
      const filteredBidsForPrice = bids.filter((bid) => bid[0] >= limitPrice)
      const liquidityMax = filteredBidsForPrice.reduce((a, c) => a + c[1], 0)
      return liquidityMax < baseSize
    } else {
      if (!asks || !asks.length) return false
      const marketPrice = Math.min(perpMarket.uiPrice, asks[0][0])
      const limitPrice = marketPrice * (1 + MAX_PERP_SLIPPAGE)
      const filteredAsksForPrice = asks.filter((ask) => ask[0] <= limitPrice)
      const liquidityMax = filteredAsksForPrice.reduce((a, c) => a + c[1], 0)
      return liquidityMax < baseSize
    }
  }, [perpMarket, position, bids, asks])

  const handleMarketClose = useCallback(async () => {
    const client = mangoStore.getState().client
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const actions = mangoStore.getState().actions

    if (!group || !mangoAccount || !perpMarket || !bids || !asks) {
      notify({
        title: 'Something went wrong. Try again later',
        type: 'error',
      })
      return
    }
    setSubmitting(true)
    try {
      const baseSize = position.getBasePositionUi(perpMarket)
      const side = baseSize > 0 ? 'sell' : 'buy'

      let price = perpMarket.uiPrice
      if (side === 'sell') {
        const marketPrice = Math.max(price, bids?.[0]?.[0] || 0)
        price = marketPrice * (1 - MAX_PERP_SLIPPAGE)
      } else {
        const marketPrice = Math.min(price, asks?.[0]?.[0] || Infinity)
        price = marketPrice * (1 + MAX_PERP_SLIPPAGE)
      }
      notify({
        type: 'info',
        title: t('trade:max-slippage-price-notification', {
          price: `$${price.toFixed(getDecimalCount(perpMarket.tickSize))}`,
        }),
      })

      const { signature: tx } = await client.perpPlaceOrder(
        group,
        mangoAccount,
        perpMarket.perpMarketIndex,
        side === 'buy' ? PerpOrderSide.bid : PerpOrderSide.ask,
        price,
        Math.abs(baseSize) * 2, // send a larger size to ensure full order is closed
        undefined, // maxQuoteQuantity
        Date.now(),
        PerpOrderType.immediateOrCancel,
        true, // reduce only
        undefined,
        undefined,
      )
      await poolIsPerpReadyForRefresh(
        () => {
          actions.fetchOpenOrders(true)
        },
        () => {
          notify({
            type: 'error',
            title: 'Please try again to close position',
          })
        },
      )
      if (soundSettings['swap-success']) {
        successSound.play()
      }
      notify({
        type: 'success',
        title: 'Transaction successful',
        txid: tx,
      })
      set((s) => {
        s.successAnimation.trade = true
      })
    } catch (e) {
      if (isMangoError(e)) {
        notify({
          title: 'There was an issue.',
          description: e.message,
          txid: e?.txid,
          type: 'error',
        })
      }
      console.error('Place trade error:', e)
    } finally {
      setSubmitting(false)
      onClose()
    }
  }, [perpMarket, position, group, onClose, soundSettings, bids, asks])

  return (
    <Modal onClose={onClose} isOpen={isOpen}>
      <h3 className="mb-2 text-center">
        {t('trade:close-confirm', { config_name: perpMarket?.name })}
      </h3>
      <div className="pb-6 text-th-fgd-3">{t('trade:price-expect')}</div>
      {insufficientLiquidity ? (
        <div className="mb-3">
          <InlineNotification
            type="error"
            desc={t('trade:insufficient-perp-liquidity')}
          />
        </div>
      ) : null}
      <Button
        className="mb-4 flex w-full items-center justify-center"
        disabled={insufficientLiquidity}
        onClick={handleMarketClose}
        size="large"
      >
        {submitting ? <Loading /> : <span>{t('trade:close-position')}</span>}
      </Button>
      <LinkButton
        className="inline-flex w-full items-center justify-center"
        onClick={onClose}
      >
        {t('cancel')}
      </LinkButton>
    </Modal>
  )
}

export default MarketCloseModal
