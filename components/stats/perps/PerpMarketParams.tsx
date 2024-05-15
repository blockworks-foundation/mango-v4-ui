import { PerpMarket } from '@blockworks-foundation/mango-v4'
import OracleProvider from '@components/shared/OracleProvider'
import Tooltip from '@components/shared/Tooltip'
import { useTranslation } from 'next-i18next'

const PerpMarketParams = ({ market }: { market: PerpMarket }) => {
  const { t } = useTranslation(['common', 'stats', 'token', 'trade'])

  const {
    name,
    minOrderSize,
    tickSize,
    initBaseAssetWeight,
    initBaseLiabWeight,
    maintBaseAssetWeight,
    maintBaseLiabWeight,
    makerFee,
    takerFee,
    groupInsuranceFund,
    minFunding,
    maxFunding,
    reduceOnly,
    baseLiquidationFee,
    positivePnlLiquidationFee,
    oracleConfig,
    settlePnlLimitWindowSizeTs,
    settlePnlLimitFactor,
  } = market

  return (
    <div className="grid grid-cols-1 border-b border-th-bkg-3 md:grid-cols-2">
      <div className="col-span-1 border-b border-th-bkg-3 px-6 py-4 md:col-span-2">
        <h2 className="text-base">{`${name} ${t('token:parameters')}`}</h2>
      </div>
      <div className="col-span-1 px-6 pt-4  md:border-r md:border-th-bkg-3">
        <div className="flex justify-between pb-4">
          <p>{t('trade:min-order-size')}</p>
          <p className="font-mono text-th-fgd-2">{minOrderSize}</p>
        </div>
        <div className="flex justify-between border-t border-th-bkg-3 py-4">
          <p>{t('trade:tick-size')}</p>
          <p className="font-mono text-th-fgd-2">{tickSize}</p>
        </div>
        <div className="flex justify-between border-t border-th-bkg-3 py-4">
          <Tooltip content={t('stats:tooltip-init-asset-liability-weight')}>
            <p className="tooltip-underline">
              {t('token:init-asset-liability-weight')}
            </p>
          </Tooltip>
          <div className="flex space-x-2">
            <p className="font-mono text-th-fgd-2">
              {initBaseAssetWeight.toFixed(2)}
            </p>
            <span className="text-th-fgd-4">|</span>
            <p className="font-mono text-th-fgd-2">
              {initBaseLiabWeight.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="flex justify-between border-t border-th-bkg-3 py-4">
          <Tooltip content={t('stats:tooltip-maint-asset-liability-weight')}>
            <p className="tooltip-underline">
              {t('token:maint-asset-liability-weight')}
            </p>
          </Tooltip>
          <div className="flex space-x-2">
            <p className="font-mono text-th-fgd-2">
              {maintBaseAssetWeight.toFixed(2)}
            </p>
            <span className="text-th-fgd-4">|</span>
            <p className="font-mono text-th-fgd-2">
              {maintBaseLiabWeight.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="flex justify-between border-t border-th-bkg-3 py-4">
          <p>{t('trade:max-leverage')}</p>
          <p className="font-mono text-th-fgd-2">
            {(1 / (maintBaseLiabWeight.toNumber() - 1)).toFixed(2)}x
          </p>
        </div>
        <div className="flex justify-between border-t border-th-bkg-3 py-4">
          <p>{t('fees')}</p>
          <p className="font-mono text-th-fgd-2">
            {(100 * makerFee.toNumber()).toFixed(2)}%{' '}
            <span className="font-body text-th-fgd-3">{t('trade:maker')}</span>
            <span className="mx-1">|</span>
            {(100 * takerFee.toNumber()).toFixed(2)}%{' '}
            <span className="font-body text-th-fgd-3">{t('trade:taker')}</span>
          </p>
        </div>
        <div className="flex justify-between border-t border-th-bkg-3 py-4">
          <Tooltip content={t('stats:tooltip-funding-limits')}>
            <p className="tooltip-underline">{t('trade:funding-limits')}</p>
          </Tooltip>
          <p className="font-mono text-th-fgd-2">
            {(100 * minFunding.toNumber()).toFixed(2)}%{' '}
            <span className="font-body text-th-fgd-3">to</span>{' '}
            {(100 * maxFunding.toNumber()).toFixed(2)}%
          </p>
        </div>
        <div className="flex justify-between border-y border-th-bkg-3 py-4 md:border-b-0">
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
            {groupInsuranceFund ? t('yes') : t('no')}
          </p>
        </div>
      </div>
      <div className="col-span-1 px-6 pb-4 md:pt-4">
        <div className="flex justify-between pb-4">
          <p>{t('trade:reduce-only')}</p>
          <p className="text-th-fgd-2">{reduceOnly ? 'True' : 'False'}</p>
        </div>
        <div className="flex justify-between border-t border-th-bkg-3 py-4">
          <Tooltip content={t('stats:tooltip-base-liquidation-fee')}>
            <p className="tooltip-underline">
              {t('stats:base-liquidation-fee')}
            </p>
          </Tooltip>
          <p className="font-mono text-th-fgd-2">
            {(100 * baseLiquidationFee.toNumber()).toFixed(2)}%
          </p>
        </div>
        <div className="flex justify-between border-t border-th-bkg-3 py-4">
          <Tooltip content={t('stats:tooltip-pnl-liquidation-fee')}>
            <p className="tooltip-underline">
              {t('stats:pnl-liquidation-fee')}
            </p>
          </Tooltip>
          <p className="font-mono text-th-fgd-2">
            {(100 * positivePnlLiquidationFee.toNumber()).toFixed(2)}%
          </p>
        </div>
        <div className="flex justify-between border-t border-th-bkg-3 py-4">
          <p>{t('token:oracle')}</p>
          {market ? <OracleProvider /> : <p>Unavailable</p>}
        </div>
        <div className="flex justify-between border-t border-th-bkg-3 py-4">
          <Tooltip content={t('token:tooltip-oracle-confidence')}>
            <p className="tooltip-underline">{t('token:oracle-confidence')}</p>
          </Tooltip>
          <p className="font-mono text-th-fgd-2">
            {oracleConfig.confFilter.toNumber().toFixed(2)}
          </p>
        </div>
        <div className="flex justify-between border-t border-th-bkg-3 py-4">
          <Tooltip
            content={t('token:tooltip-oracle-staleness', {
              slots: oracleConfig.maxStalenessSlots.toNumber(),
            })}
          >
            <p className="tooltip-underline">{t('token:oracle-staleness')}</p>
          </Tooltip>
          <p className="font-mono text-th-fgd-2">
            {oracleConfig.maxStalenessSlots.toNumber()}{' '}
            <span className="font-body text-th-fgd-4">Slots</span>
          </p>
        </div>
        <div className="flex justify-between border-t border-th-bkg-3 py-4">
          <Tooltip content={t('stats:tooltip-settle-pnl-factor')}>
            <p className="tooltip-underline">{t('stats:settle-pnl-factor')}</p>
          </Tooltip>
          <p className="font-mono text-th-fgd-2">
            {settlePnlLimitFactor}x{' '}
            <span className="font-body text-th-fgd-4">per</span>{' '}
            {settlePnlLimitWindowSizeTs.toNumber() / 3600}h
          </p>
        </div>
      </div>
    </div>
  )
}

export default PerpMarketParams
