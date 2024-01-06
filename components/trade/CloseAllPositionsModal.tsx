import { FunctionComponent, useState } from 'react'
import mangoStore from '@store/mangoStore'
import { useTranslation } from 'next-i18next'
import Modal from '@components/shared/Modal'
import Button, { LinkButton } from '@components/shared/Button'
import { notify } from 'utils/notifications'
import Loading from '@components/shared/Loading'
import { isMangoError } from 'types'
import { ModalProps } from 'types/modal'
import useMangoGroup from 'hooks/useMangoGroup'
import useOpenPerpPositions from 'hooks/useOpenPerpPositions'
import { floorToDecimal, getDecimalCount } from 'utils/numbers'
import MarketLogos from './MarketLogos'
import PerpSideBadge from './PerpSideBadge'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import { MAX_PERP_SLIPPAGE } from 'utils/constants'

export const handleCloseAll = async (
  setSubmitting?: (s: boolean) => void,
  onClose?: () => void,
) => {
  const client = mangoStore.getState().client
  const mangoAccount = mangoStore.getState().mangoAccount.current
  const actions = mangoStore.getState().actions
  const group = mangoStore.getState().group

  if (!group || !mangoAccount) {
    notify({
      title: 'Something went wrong. Try again later',
      type: 'error',
    })
    return
  }
  if (setSubmitting) {
    setSubmitting(true)
  }
  try {
    const { signature: tx } = await client.perpCloseAll(
      group,
      mangoAccount,
      MAX_PERP_SLIPPAGE,
    )
    actions.fetchOpenOrders()
    notify({
      type: 'success',
      title: 'Transaction successful',
      txid: tx,
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
    if (setSubmitting) {
      setSubmitting(false)
    }
    if (onClose) {
      onClose()
    }
  }
}

const CloseAllPositionsModal: FunctionComponent<ModalProps> = ({
  onClose,
  isOpen,
}) => {
  const { t } = useTranslation(['common', 'trade'])
  const [submitting, setSubmitting] = useState(false)
  const { openPerpPositions } = useOpenPerpPositions()
  const { group } = useMangoGroup()

  if (!group) return null

  return (
    <Modal onClose={onClose} isOpen={isOpen}>
      <h3 className="mb-2 text-center">{t('trade:close-all-positions')}</h3>
      <div className="pb-6 text-th-fgd-3">{t('trade:price-expect')}</div>
      <div className="border-b border-th-bkg-3">
        {openPerpPositions.map((position, i) => {
          const market = group.getPerpMarketByMarketIndex(position.marketIndex)
          const basePosition = position.getBasePositionUi(market)
          const floorBasePosition = floorToDecimal(
            basePosition,
            getDecimalCount(market.minOrderSize),
          ).toNumber()

          if (!basePosition) return null

          return (
            <div
              className="flex items-center justify-between border-t border-th-bkg-3 py-3"
              key={market.name + i}
            >
              <div className="flex items-center">
                <MarketLogos market={market} />
                <p className="mr-2">{market.name}</p>
                <PerpSideBadge basePosition={basePosition} />
              </div>
              <p className="font-mono text-th-fgd-2">
                <FormatNumericValue value={Math.abs(floorBasePosition)} />
                <span className="mx-1 text-th-bkg-4">|</span>
                <FormatNumericValue
                  value={Math.abs(floorBasePosition * market.uiPrice)}
                  isUsd
                />
              </p>
            </div>
          )
        })}
      </div>
      <Button
        className="mb-4 mt-6 flex w-full items-center justify-center"
        onClick={() => handleCloseAll(setSubmitting, onClose)}
        size="large"
      >
        {submitting ? (
          <Loading />
        ) : (
          <span>{t('trade:close-all-positions')}</span>
        )}
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

export default CloseAllPositionsModal
