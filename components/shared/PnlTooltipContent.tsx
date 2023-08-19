import { useTranslation } from 'next-i18next'
import { formatCurrencyValue } from 'utils/numbers'
import FormatNumericValue from './FormatNumericValue'

const getPnlColor = (pnl: number) => {
  return pnl < 0 ? 'text-th-down' : pnl > 0 ? 'text-th-up' : 'text-th-fgd-3'
}

const PnlTooltipContent = ({
  unrealizedPnl,
  realizedPnl,
  totalPnl,
  unsettledPnl,
  roe,
}: {
  unrealizedPnl: number
  realizedPnl: number
  totalPnl: number
  unsettledPnl: number
  roe: number
}) => {
  const { t } = useTranslation(['common', 'trade'])
  return (
    <div className="w-44">
      <div className="mb-3 space-y-1">
        <div className="flex justify-between">
          <p className="mr-3">{t('trade:unrealized-pnl')}</p>
          <span className={`font-mono ${getPnlColor(unrealizedPnl)}`}>
            {formatCurrencyValue(unrealizedPnl, 2)}
          </span>
        </div>
        <div className="flex justify-between border-b border-th-bkg-4 pb-3">
          <p className="mr-3">{t('trade:realized-pnl')}</p>
          <span className={`font-mono ${getPnlColor(realizedPnl)}`}>
            {formatCurrencyValue(realizedPnl, 2)}
          </span>
        </div>
        <div className="flex justify-between pt-1.5">
          <p className="mr-3">{t('trade:total-pnl')}</p>
          <span className={`font-mono ${getPnlColor(totalPnl)}`}>
            {formatCurrencyValue(totalPnl, 2)}
          </span>
        </div>
        <div className="flex justify-between border-b border-th-bkg-4 pb-3">
          <p className="mr-3">{t('trade:return-on-equity')}</p>
          <span className={`font-mono ${getPnlColor(roe)}`}>
            <FormatNumericValue classNames="text-xs" value={roe} decimals={2} />
            %
          </span>
        </div>
        <div className="flex justify-between pt-1.5">
          <p className="mr-3">
            {t('trade:unsettled')} {t('pnl')}
          </p>
          <span className={`font-mono ${getPnlColor(unsettledPnl)}`}>
            {formatCurrencyValue(unsettledPnl, 2)}
          </span>
        </div>
      </div>
      <a
        href="https://docs.mango.markets/mango-markets/settle-pnl"
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('learn-more')}
      </a>
    </div>
  )
}

export default PnlTooltipContent
