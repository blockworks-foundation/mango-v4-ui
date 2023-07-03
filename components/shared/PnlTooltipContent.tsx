import { useTranslation } from 'next-i18next'
import { formatCurrencyValue } from 'utils/numbers'

const PnlTooltipContent = ({
  unrealizedPnl,
  realizedPnl,
  totalPnl,
  unsettledPnl,
}: {
  unrealizedPnl: number
  realizedPnl: number
  totalPnl: number
  unsettledPnl: number
}) => {
  const { t } = useTranslation(['common', 'trade'])
  return (
    <>
      <div className="flex justify-between border-b border-th-bkg-3 pb-2">
        <p className="mr-3">
          {t('trade:unsettled')} {t('pnl')}
        </p>
        <span className="font-mono text-th-fgd-2">
          {formatCurrencyValue(unsettledPnl, 2)}
        </span>
      </div>
      <div className="mb-3 space-y-1 pt-2">
        <div className="flex justify-between">
          <p className="mr-3">{t('trade:unrealized-pnl')}</p>
          <span className="font-mono text-th-fgd-2">
            {formatCurrencyValue(unrealizedPnl, 2)}
          </span>
        </div>
        <div className="flex justify-between">
          <p className="mr-3">{t('trade:realized-pnl')}</p>
          <span className="font-mono text-th-fgd-2">
            {formatCurrencyValue(realizedPnl, 2)}
          </span>
        </div>
        <div className="flex justify-between">
          <p className="mr-3">{t('trade:total-pnl')}</p>
          <span className="font-mono text-th-fgd-2">
            {formatCurrencyValue(totalPnl, 2)}
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
    </>
  )
}

export default PnlTooltipContent
