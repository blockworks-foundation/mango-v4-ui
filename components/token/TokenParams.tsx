import {
  Bank,
  I80F48,
  toUiDecimals,
  toUiDecimalsForQuote,
} from '@blockworks-foundation/mango-v4'
import Tooltip from '@components/shared/Tooltip'
import { BN } from '@coral-xyz/anchor'
import mangoStore from '@store/mangoStore'
import { useTranslation } from 'next-i18next'
import { useMemo } from 'react'
import { formatCurrencyValue } from 'utils/numbers'
import CollateralWeightDisplay from '@components/shared/CollateralWeightDisplay'
import OracleProvider from '@components/shared/OracleProvider'

const TokenParams = ({ bank }: { bank: Bank }) => {
  const { t } = useTranslation(['common', 'activity', 'token'])

  const mintInfo = useMemo(() => {
    const group = mangoStore.getState().group
    if (!bank || !group) return
    return group.mintInfosMapByMint.get(bank.mint.toString())
  }, [bank])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 md:border-b md:border-th-bkg-3">
      <div className="col-span-1 border-b border-th-bkg-3 px-6 py-4 md:col-span-2">
        <h2 className="text-base">{`${bank.name} ${t('token:parameters')}`}</h2>
      </div>
      <div className="col-span-1 px-6 pt-4  md:border-r md:border-th-bkg-3">
        <div className="flex justify-between pb-4">
          <Tooltip content={t('token:tooltip-init-asset-liability-weight')}>
            <p className="tooltip-underline">
              {t('token:init-asset-liability-weight')}
            </p>
          </Tooltip>
          <div className="flex space-x-2">
            <div className="font-mono text-th-fgd-2">
              <CollateralWeightDisplay bank={bank} />
            </div>
            <span className="text-th-fgd-4">|</span>
            <p className="font-mono text-th-fgd-2">
              {bank.scaledInitLiabWeight(bank.price).toFixed(2)}x
            </p>
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
              {bank.maintAssetWeight.toFixed(2)}x
            </p>
            <span className="text-th-fgd-4">|</span>
            <p className="font-mono text-th-fgd-2">
              {bank.maintLiabWeight.toFixed(2)}x
            </p>
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
          <Tooltip content={t('token:tooltip-borrow-upkeep-rate')}>
            <p className="tooltip-underline">{t('token:borrow-upkeep-rate')}</p>
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
        {mintInfo ? (
          <div className="flex justify-between border-t border-th-bkg-3 py-4">
            <Tooltip
              content={t('trade:tooltip-insured', { tokenOrMarket: bank.name })}
            >
              <p className="tooltip-underline">
                {t('trade:insured', { token: '' })}
              </p>
            </Tooltip>
            <p className="text-th-fgd-2">
              {mintInfo.groupInsuranceFund ? t('yes') : t('no')}
            </p>
          </div>
        ) : null}
        <div className="flex justify-between border-y border-th-bkg-3 py-4 md:border-b-0">
          <Tooltip content={t('token:tooltip-deposit-borrow-scaling-start')}>
            <p className="tooltip-underline">
              {t('token:deposit-borrow-scaling-start')}
            </p>
          </Tooltip>
          <div className="flex flex-wrap justify-end space-x-2">
            <p className="font-mono text-th-fgd-2">
              {bank.name === 'USDC'
                ? `$${toUiDecimalsForQuote(
                    bank.depositWeightScaleStartQuote,
                  ).toExponential(1)}`
                : formatCurrencyValue(
                    toUiDecimalsForQuote(bank.depositWeightScaleStartQuote),
                  )}
            </p>
            <span className="text-th-fgd-4">|</span>
            <p className="font-mono text-th-fgd-2">
              {bank.name === 'USDC'
                ? `$${toUiDecimalsForQuote(
                    bank.depositWeightScaleStartQuote,
                  ).toExponential(1)}`
                : formatCurrencyValue(
                    toUiDecimalsForQuote(bank.borrowWeightScaleStartQuote),
                  )}
            </p>
          </div>
        </div>
      </div>
      <div className="col-span-1 px-6 pb-4 md:pt-4">
        <div className="flex justify-between py-4 md:pt-0">
          <Tooltip content={t('token:tooltip-net-borrow-period')}>
            <p className="tooltip-underline">{t('token:net-borrow-period')}</p>
          </Tooltip>
          <p className="font-mono text-th-fgd-2">
            {bank.netBorrowLimitWindowSizeTs.div(new BN(3600)).toNumber()}h
          </p>
        </div>
        <div className="flex justify-between border-t border-th-bkg-3 py-4">
          <Tooltip content={t('token:tooltip-net-borrows-in-period')}>
            <p className="tooltip-underline">
              {t('token:net-borrows-in-period')}
            </p>
          </Tooltip>
          <p className="font-mono text-th-fgd-2">
            {formatCurrencyValue(
              toUiDecimalsForQuote(
                I80F48.fromI64(bank.netBorrowsInWindow).mul(bank.price),
              ),
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
            {formatCurrencyValue(
              toUiDecimals(bank.netBorrowLimitPerWindowQuote, 6),
            )}
          </p>
        </div>
        <div className="flex justify-between border-t border-th-bkg-3 py-4">
          <p>{t('token:oracle')}</p>
          {bank ? <OracleProvider bank={bank} /> : <p>Unavailable</p>}
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
      </div>
    </div>
  )
}

export default TokenParams
