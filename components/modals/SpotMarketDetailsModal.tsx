import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import { useTranslation } from 'next-i18next'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { Serum3Market } from '@blockworks-foundation/mango-v4'
import Button from '@components/shared/Button'
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid'
import { useMemo } from 'react'
import Tooltip from '@components/shared/Tooltip'
import OracleProvider from '@components/shared/OracleProvider'
import mangoStore from '@store/mangoStore'

interface SpotMarketDetailsModalProps {
  market: Serum3Market | undefined
}

type ModalCombinedProps = SpotMarketDetailsModalProps & ModalProps

const SpotMarketDetailsModal = ({
  isOpen,
  onClose,
  market,
}: ModalCombinedProps) => {
  const { t } = useTranslation(['common', 'trade'])
  const { serumOrPerpMarket } = useSelectedMarket()

  const [baseBank, quoteBank] = useMemo(() => {
    const group = mangoStore.getState().group
    if (!group || !market) return [undefined, undefined]
    const base = group.getFirstBankByTokenIndex(market.baseTokenIndex)
    const quote = group.getFirstBankByTokenIndex(market.quoteTokenIndex)
    return [base, quote]
  }, [market])

  const [baseMintInfo, quoteMintInfo] = useMemo(() => {
    const group = mangoStore.getState().group
    if (!baseBank || !quoteBank || !group) return [undefined, undefined]
    const base = group.mintInfosMapByMint.get(baseBank.mint.toString())
    const quote = group.mintInfosMapByMint.get(quoteBank.mint.toString())
    return [base, quote]
  }, [baseBank, quoteBank])

  const [bidLeverage, askLeverage] = useMemo(() => {
    const group = mangoStore.getState().group
    if (!group || !market) return [undefined, undefined]
    const bid = market.maxBidLeverage(group).toFixed(1)
    const ask = market.maxAskLeverage(group).toFixed(1)
    return [bid, ask]
  }, [market])

  return market && serumOrPerpMarket ? (
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
          <p className="font-mono text-th-fgd-2">
            {serumOrPerpMarket.minOrderSize}
          </p>
        </div>
        <div className="flex justify-between">
          <p>{t('trade:tick-size')}</p>
          <p className="font-mono text-th-fgd-2">
            {serumOrPerpMarket.tickSize}
          </p>
        </div>
        <div className="flex justify-between">
          <p>{t('trade:max-buy-leverage')}</p>
          <p className="font-mono text-th-fgd-2">{bidLeverage}x</p>
        </div>
        <div className="flex justify-between">
          <p>{t('trade:max-sell-leverage')}</p>
          <p className="font-mono text-th-fgd-2">{askLeverage}x</p>
        </div>
        <div className="flex justify-between">
          <p>{t('trade:oracle')}</p>
          <OracleProvider />
        </div>
        {baseMintInfo ? (
          <div className="flex justify-between">
            <Tooltip
              content={
                <div>
                  {t('trade:tooltip-insured', {
                    tokenOrMarket: baseBank?.name,
                  })}
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
                {t('trade:insured', { token: baseBank?.name })}
              </p>
            </Tooltip>
            <p className="font-mono text-th-fgd-2">
              {baseMintInfo.groupInsuranceFund ? t('yes') : t('no')}
            </p>
          </div>
        ) : null}
        {quoteMintInfo ? (
          <div className="flex justify-between">
            <Tooltip
              content={
                <div>
                  {t('trade:tooltip-insured', {
                    tokenOrMarket: quoteBank?.name,
                  })}
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
                {t('trade:insured', { token: quoteBank?.name })}
              </p>
            </Tooltip>
            <p className="font-mono text-th-fgd-2">
              {quoteMintInfo.groupInsuranceFund ? t('yes') : t('no')}
            </p>
          </div>
        ) : null}
      </div>
      <Button className="mt-6 w-full" onClick={onClose}>
        {t('close')}
      </Button>
    </Modal>
  ) : null
}

export default SpotMarketDetailsModal
