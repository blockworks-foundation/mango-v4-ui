import { FunctionComponent, useCallback, useState } from 'react'
import mangoStore from '@store/mangoStore'
import { useTranslation } from 'next-i18next'
import {
  PerpOrderSide,
  PerpOrderType,
  PerpPosition,
} from '@blockworks-foundation/mango-v4'
import Modal from '@components/shared/Modal'
import Button, { LinkButton } from '@components/shared/Button'
import { calculateEstPriceForBaseSize } from 'utils/tradeForm'
import { notify } from 'utils/notifications'
import Loading from '@components/shared/Loading'

interface MarketCloseModalProps {
  onClose: () => void
  isOpen: boolean
  position: PerpPosition
}

const MarketCloseModal: FunctionComponent<MarketCloseModalProps> = ({
  onClose,
  isOpen,
  position,
}) => {
  const { t } = useTranslation('common')
  const [submitting, setSubmitting] = useState(false)
  const group = mangoStore.getState().group
  const perpMarket = group?.getPerpMarketByMarketIndex(position.marketIndex)

  const handleMarketClose = useCallback(async () => {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const actions = mangoStore.getState().actions

    if (!group || !mangoAccount || !perpMarket) return
    setSubmitting(true)
    try {
      const baseSize = position.getBasePositionUi(perpMarket)
      const sideToClose = baseSize > 0 ? 'sell' : 'buy'
      const orderbook = mangoStore.getState().selectedMarket.orderbook
      const price = calculateEstPriceForBaseSize(
        orderbook,
        baseSize,
        sideToClose
      )

      const maxSlippage = 0.025
      // const perpOrderType =
      //   tradeForm.tradeType === 'Market'
      //     ? PerpOrderType.market
      //     : tradeForm.ioc
      //     ? PerpOrderType.immediateOrCancel
      //     : tradeForm.postOnly
      //     ? PerpOrderType.postOnly
      //     : PerpOrderType.limit
      const tx = await client.perpPlaceOrder(
        group,
        mangoAccount,
        perpMarket.perpMarketIndex,
        sideToClose === 'buy' ? PerpOrderSide.bid : PerpOrderSide.ask,
        price * (sideToClose === 'buy' ? 1 + maxSlippage : 1 - maxSlippage),
        Math.abs(baseSize) * 2, // send a larger size to ensure full order is closed
        undefined, // maxQuoteQuantity
        Date.now(),
        PerpOrderType.immediateOrCancel,
        true, // reduce only
        undefined,
        undefined
      )
      actions.fetchOpenOrders()
      notify({
        type: 'success',
        title: 'Transaction successful',
        txid: tx,
      })
    } catch (e: any) {
      notify({
        title: 'There was an issue.',
        description: e.message,
        txid: e?.txid,
        type: 'error',
      })
      console.error('Place trade error:', e)
    } finally {
      setSubmitting(false)
    }
  }, [])

  return (
    <Modal onClose={onClose} isOpen={isOpen}>
      <h3 className="mb-2">
        {t('close-confirm', { config_name: perpMarket?.name })}
      </h3>
      <div className="pb-6 text-th-fgd-3">{t('price-expect')}</div>
      <div className="flex items-center justify-center">
        <Button onClick={handleMarketClose}>
          {submitting ? <Loading /> : <span>Close Position</span>}
        </Button>
        <LinkButton className="ml-4 text-th-fgd-1" onClick={onClose}>
          {t('cancel')}
        </LinkButton>
      </div>
    </Modal>
  )
}

export default MarketCloseModal
