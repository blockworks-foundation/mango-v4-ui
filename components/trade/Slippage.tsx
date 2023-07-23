import Tooltip from '@components/shared/Tooltip'
import mangoStore from '@store/mangoStore'
import useMarkPrice from 'hooks/useMarkPrice'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useTranslation } from 'next-i18next'
import { useMemo } from 'react'
// import { notify } from 'utils/notifications'
import { calculateSlippage } from 'utils/tradeForm'

const Slippage = () => {
  const { t } = useTranslation('trade')
  const markPrice = useMarkPrice()
  const tradeForm = mangoStore((s) => s.tradeForm)
  const { selectedMarket } = useSelectedMarket()

  const slippage = useMemo(() => {
    try {
      if (tradeForm.tradeType === 'Market' && markPrice && selectedMarket) {
        const orderbook = mangoStore.getState().selectedMarket.orderbook
        return calculateSlippage(
          orderbook,
          Number(tradeForm.baseSize),
          tradeForm.side,
          markPrice,
        )
      }
    } catch (e) {
      console.error({ type: 'info', title: 'Unable to calculate slippage' })
      return 100_000
    }
    return 0
  }, [tradeForm, markPrice, selectedMarket])

  return slippage ? (
    <div className="flex justify-between text-xs">
      <Tooltip content={t('trade:tooltip-slippage')}>
        <p className="tooltip-underline mr-4">{t('trade:est-slippage')}</p>
      </Tooltip>
      <p
        className={`font-mono ${
          slippage <= 1
            ? 'text-th-success'
            : slippage <= 3
            ? 'text-th-warning'
            : 'text-th-error'
        }`}
      >
        {slippage === 100_000 ? 'Unavailable' : `${slippage.toFixed(2)}%`}
      </p>
    </div>
  ) : null
}

export default Slippage
