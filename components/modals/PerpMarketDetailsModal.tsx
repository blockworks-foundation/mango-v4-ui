import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import { useTranslation } from 'next-i18next'
import { PerpMarket } from '@blockworks-foundation/mango-v4'
import Button from '@components/shared/Button'
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid'
import Tooltip from '@components/shared/Tooltip'
import { useRouter } from 'next/router'
import OracleProvider from '@components/shared/OracleProvider'

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
  const router = useRouter()

  const goToPerpDetails = (marketName: string) => {
    router.push(`/stats?market=${marketName}`, undefined, { shallow: true })
  }

  return market ? (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center">
        <h2 className="text-center text-lg">
          {t('trade:market-details', { market: market.name })}
        </h2>
        {market?.reduceOnly ? (
          <div className="mt-1 flex items-center">
            <ExclamationTriangleIcon className="mr-1 mt-0.5 h-3 w-3 text-th-warning" />
            <p className="text-xs leading-none text-th-warning">
              {t('trade:reduce-only')}
            </p>
          </div>
        ) : null}
      </div>
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
        <div className="flex justify-between">
          <p>{t('trade:oracle')}</p>
          <OracleProvider />
        </div>
        <div className="flex justify-between">
          <Tooltip
            content={
              <div>
                {t('trade:tooltip-insured', { tokenOrMarket: market.name })}
                <a
                  className="mt-2 flex items-center"
                  href="https://docs.mango.markets/mango-markets/insurance-fund"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Learn more
                </a>
              </div>
            }
          >
            <p className="tooltip-underline">
              {t('trade:insured', { token: '' })}
            </p>
          </Tooltip>
          <p className="text-th-fgd-2">
            {market.groupInsuranceFund ? t('yes') : t('no')}
          </p>
        </div>
      </div>
      <Button
        className="mt-6 w-full"
        onClick={() => goToPerpDetails(market.name)}
      >
        {t('trade:more-details')}
      </Button>
      <Button className="mt-3 w-full" onClick={onClose} secondary>
        {t('close')}
      </Button>
    </Modal>
  ) : null
}

export default PerpMarketDetailsModal
