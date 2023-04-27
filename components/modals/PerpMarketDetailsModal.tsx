import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import { useTranslation } from 'next-i18next'
import { PerpMarket } from '@blockworks-foundation/mango-v4'
import Button from '@components/shared/Button'
// import Tooltip from '@components/shared/Tooltip'

interface PerpMarketDetailsModalProps {
  market: PerpMarket | undefined
}

type ModalCombinedProps = PerpMarketDetailsModalProps & ModalProps

const PerpMarketDetailsModal = ({
  isOpen,
  onClose,
  market,
}: ModalCombinedProps) => {
  const { t } = useTranslation(['common', 'trade'])

  return market ? (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-center text-lg">
        {t('trade:market-details', { market: market.name })}
      </h2>
      <div className="mt-4 space-y-2.5">
        <div className="flex justify-between">
          <p>{t('trade:min-order-size')}</p>
          <p className="font-mono text-th-fgd-2">{market.minOrderSize}</p>
        </div>
        <div className="flex justify-between">
          <p>{t('trade:tick-size')}</p>
          <p className="font-mono text-th-fgd-2">{market.tickSize}</p>
        </div>
        <div className="flex justify-between">
          <p>{t('trade:init-leverage')}</p>
          <p className="font-mono text-th-fgd-2">
            {(1 / (market.initBaseLiabWeight.toNumber() - 1)).toFixed(2)}x
          </p>
        </div>
        <div className="flex justify-between">
          <p>{t('trade:max-leverage')}</p>
          <p className="font-mono text-th-fgd-2">
            {(1 / (market.maintBaseLiabWeight.toNumber() - 1)).toFixed(2)}x
          </p>
        </div>
        <div className="flex justify-between">
          <p>{t('fees')}</p>
          <p className="font-mono text-th-fgd-2">
            {(100 * market.makerFee.toNumber()).toFixed(2)}%{' '}
            <span className="font-body text-th-fgd-3">{t('trade:maker')}</span>
            <span className="mx-1">|</span>
            {(100 * market.takerFee.toNumber()).toFixed(2)}%{' '}
            <span className="font-body text-th-fgd-3">{t('trade:taker')}</span>
          </p>
        </div>
        <div className="flex justify-between">
          <p>{t('trade:funding-limits')}</p>
          <p className="font-mono text-th-fgd-2">
            {(100 * market.minFunding.toNumber()).toFixed(2)}%{' '}
            <span className="font-body text-th-fgd-3">to</span>{' '}
            {(100 * market.maxFunding.toNumber()).toFixed(2)}%
          </p>
        </div>
        {/* Uncomment when insurance fund is ready */}
        {/* <div className="flex justify-between">
          <Tooltip
            content={t('trade:tooltip-insured', { tokenOrMarket: market.name })}
          >
            <p className="tooltip-underline">
              {t('trade:insured', { token: '' })}
            </p>
          </Tooltip>
          <p className="text-th-fgd-2">
            {market.groupInsuranceFund ? t('yes') : t('no')}
          </p>
        </div> */}
      </div>
      <Button className="mt-6 w-full" onClick={onClose}>
        {t('close')}
      </Button>
    </Modal>
  ) : null
}

export default PerpMarketDetailsModal
