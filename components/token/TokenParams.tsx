import {
  Bank,
  I80F48,
  OracleProvider,
  toUiDecimals,
  toUiDecimalsForQuote,
} from '@blockworks-foundation/mango-v4'
import Tooltip from '@components/shared/Tooltip'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid'
import { useTranslation } from 'next-i18next'
import { useMemo } from 'react'
import { formatCurrencyValue, formatNumericValue } from 'utils/numbers'

const TokenParams = ({ bank }: { bank: Bank }) => {
  const { t } = useTranslation(['common', 'activity', 'token'])

  const [oracleProvider, oracleLinkPath] = useMemo(() => {
    switch (bank.oracleProvider) {
      case OracleProvider.Pyth:
        return [
          'Pyth',
          `https://pyth.network/price-feeds/crypto-${bank.name.toLowerCase()}-usd`,
        ]
      case OracleProvider.Switchboard:
        return [
          'Switchboard',
          `https://switchboard.xyz/explorer/3/${bank.oracle.toString()}`,
        ]
      case OracleProvider.Stub:
        return ['Stub', '']
      default:
        return ['Unknown', '']
    }
  }, [bank])

  return (
    <div className="grid grid-cols-1 border-b border-th-bkg-3 md:grid-cols-2">
      <div className="col-span-1 border-b border-th-bkg-3 px-6 py-4 md:col-span-2">
        <h2 className="text-base">{bank.name} Paramaters</h2>
      </div>
      <div className="col-span-1 px-6 py-4  md:border-r md:border-th-bkg-3">
        <div className="flex justify-between pb-4">
          <Tooltip content={t('token:tooltip-init-asset-liability-weight')}>
            <p className="tooltip-underline">
              {t('token:init-asset-liability-weight')}
            </p>
          </Tooltip>
          <div className="flex space-x-2">
            <p className="font-mono text-th-fgd-2">
              {bank.initAssetWeight.toFixed(2)}
            </p>
            <span className="text-th-fgd-4">|</span>
            <p>{bank.initLiabWeight.toFixed(2)}</p>
          </div>
        </div>
        <div className="flex justify-between border-t border-th-bkg-3 py-4">
          <Tooltip content={t('token:tooltip-maint-asset-liability-weight')}>
            <p className="tooltip-underline">
              {t('token:maint-asset-liability-weight')}
            </p>
          </Tooltip>
          <div className="flex space-x-2">
            <p className="font-mono text-th-fgd-2">
              {bank.maintAssetWeight.toFixed(2)}
            </p>
            <span className="text-th-fgd-4">|</span>
            <p>{bank.maintLiabWeight.toFixed(2)}</p>
          </div>
        </div>
        <div className="flex justify-between border-t border-th-bkg-3 py-4">
          <Tooltip content={t('tooltip-borrow-fee')}>
            <p className="tooltip-underline">{t('borrow-fee')}</p>
          </Tooltip>
          <p className="font-mono text-th-fgd-2">
            {(100 * bank.loanOriginationFeeRate.toNumber()).toFixed(2)}%
          </p>
        </div>
        <div className="flex justify-between border-t border-th-bkg-3 py-4">
          <Tooltip content={t('token:tooltip-borrow-upkeep-fee')}>
            <p className="tooltip-underline">{t('token:borrow-upkeep-fee')}</p>
          </Tooltip>
          <p className="font-mono text-th-fgd-2">
            {(100 * bank.loanFeeRate.toNumber()).toFixed(2)}%
          </p>
        </div>
        <div className="flex justify-between border-t border-th-bkg-3 py-4">
          <Tooltip
            content={t('token:tooltip-liquidation-fee', { symbol: bank.name })}
          >
            <p className="tooltip-underline">{t('activity:liquidation-fee')}</p>
          </Tooltip>
          <p className="font-mono text-th-fgd-2">
            {(bank.liquidationFee.toNumber() * 100).toFixed(2)}%
          </p>
        </div>
        <div className="flex justify-between border-y border-th-bkg-3 py-4 md:border-b-0">
          <Tooltip content={t('token:tooltip-deposit-borrow-scaling-start')}>
            <p className="tooltip-underline">
              {t('token:deposit-borrow-scaling-start')}
            </p>
          </Tooltip>
          <div className="flex space-x-2">
            <p className="font-mono text-th-fgd-2">
              {formatCurrencyValue(
                toUiDecimalsForQuote(bank.depositWeightScaleStartQuote)
              )}
            </p>
            <span className="text-th-fgd-4">|</span>
            <p className="font-mono text-th-fgd-2">
              {formatCurrencyValue(
                toUiDecimalsForQuote(bank.borrowWeightScaleStartQuote)
              )}
            </p>
          </div>
        </div>
      </div>
      <div className="col-span-1 px-6 pb-4 md:pt-4">
        <div className="flex justify-between pb-4">
          <Tooltip content={t('token:tooltip-net-borrows-in-period')}>
            <p className="tooltip-underline">
              {t('token:net-borrows-in-period')}
            </p>
          </Tooltip>
          <p className="font-mono text-th-fgd-2">
            {formatNumericValue(
              toUiDecimalsForQuote(I80F48.fromI64(bank.netBorrowsInWindow))
            )}
          </p>
        </div>
        <div className="flex justify-between border-t border-th-bkg-3 py-4">
          <Tooltip content={t('token:tooltip-net-borrow-limit-in-period')}>
            <p className="tooltip-underline">
              {t('token:net-borrow-limit-in-period')}
            </p>
          </Tooltip>
          <p className="font-mono text-th-fgd-2">
            {formatNumericValue(
              toUiDecimals(bank.netBorrowLimitPerWindowQuote, 6)
            )}
          </p>
        </div>
        <div className="flex justify-between border-t border-th-bkg-3 py-4">
          <p>{t('token:oracle')}</p>
          <a
            className="flex items-center"
            href={oracleLinkPath}
            target="_blank"
            rel="noopener noreferrer"
          >
            <p className="mr-1.5 text-th-fgd-2">{oracleProvider}</p>
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          </a>
        </div>
        <div className="flex justify-between border-t border-th-bkg-3 py-4">
          <Tooltip content={t('token:tooltip-oracle-confidence')}>
            <p className="tooltip-underline">{t('token:oracle-confidence')}</p>
          </Tooltip>
          <p className="font-mono text-th-fgd-2">
            {(100 * bank.oracleConfig.confFilter.toNumber()).toFixed(2)}%
          </p>
        </div>
        <div className="flex justify-between border-t border-th-bkg-3 py-4">
          <Tooltip
            content={t('token:tooltip-oracle-staleness', {
              slots: bank.oracleConfig.maxStalenessSlots.toNumber(),
            })}
          >
            <p className="tooltip-underline">{t('token:oracle-staleness')}</p>
          </Tooltip>
          <p className="font-mono text-th-fgd-2">
            {bank.oracleConfig.maxStalenessSlots.toNumber()}{' '}
            <span className="font-body text-th-fgd-4">Slots</span>
          </p>
        </div>
        <div className="flex justify-between border-t border-th-bkg-3 py-4">
          <Tooltip content={t('token:tooltip-insurance-rate-curve')}>
            <p className="tooltip-underline">
              {t('token:insurance-rate-curve')}
            </p>
          </Tooltip>
          <p className="font-mono text-th-fgd-2">?</p>
        </div>
      </div>
    </div>
  )
}

export default TokenParams
