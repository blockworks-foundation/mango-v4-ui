import {
  HealthType,
  MangoAccount,
  PerpMarket,
  Serum3Market,
  toUiDecimalsForQuote,
} from '@blockworks-foundation/mango-v4'
import HealthImpact from '@components/shared/HealthImpact'
import Tooltip from '@components/shared/Tooltip'
import mangoStore from '@store/mangoStore'
import useMangoGroup from 'hooks/useMangoGroup'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useTranslation } from 'next-i18next'
import { useMemo } from 'react'
import { formatFixedDecimals } from 'utils/numbers'
import Slippage from './Slippage'

const TradeSummary = ({
  mangoAccount,
}: {
  mangoAccount: MangoAccount | undefined
}) => {
  const { t } = useTranslation(['common', 'trade'])
  const { group } = useMangoGroup()
  const tradeForm = mangoStore((s) => s.tradeForm)
  const { selectedMarket } = useSelectedMarket()

  const maintProjectedHealth = useMemo(() => {
    if (!mangoAccount || !group || !Number.isFinite(Number(tradeForm.baseSize)))
      return 100

    let simulatedHealthRatio = 0
    try {
      if (selectedMarket instanceof Serum3Market) {
        simulatedHealthRatio =
          tradeForm.side === 'sell'
            ? mangoAccount.simHealthRatioWithSerum3AskUiChanges(
                group,
                Number(tradeForm.baseSize),
                selectedMarket.serumMarketExternal,
                HealthType.maint
              )
            : mangoAccount.simHealthRatioWithSerum3BidUiChanges(
                group,
                Number(tradeForm.quoteSize),
                selectedMarket.serumMarketExternal,
                HealthType.maint
              )
      } else if (selectedMarket instanceof PerpMarket) {
        simulatedHealthRatio =
          tradeForm.side === 'sell'
            ? mangoAccount.simHealthRatioWithPerpAskUiChanges(
                group,
                selectedMarket.perpMarketIndex,
                parseFloat(tradeForm.baseSize)
              )
            : mangoAccount.simHealthRatioWithPerpBidUiChanges(
                group,
                selectedMarket.perpMarketIndex,
                parseFloat(tradeForm.baseSize)
              )
      }
    } catch (e) {
      console.warn('Error calculating projected health: ', e)
    }

    return simulatedHealthRatio > 100
      ? 100
      : simulatedHealthRatio < 0
      ? 0
      : Math.trunc(simulatedHealthRatio)
  }, [group, mangoAccount, selectedMarket, tradeForm])

  return (
    <div className="space-y-2 px-3 md:px-4">
      <div className="flex justify-between text-xs">
        <p>{t('trade:order-value')}</p>
        <p className="text-th-fgd-2">
          {tradeForm.price && tradeForm.baseSize
            ? formatFixedDecimals(
                parseFloat(tradeForm.price) * parseFloat(tradeForm.baseSize),
                true
              )
            : '0.00'}
        </p>
      </div>
      <HealthImpact maintProjectedHealth={maintProjectedHealth} small />
      <div className="flex justify-between text-xs">
        <Tooltip content="The amount of capital you have to use for trades and loans. When your free collateral reaches $0 you won't be able to trade, borrow or withdraw.">
          <p className="tooltip-underline">{t('free-collateral')}</p>
        </Tooltip>
        <p className="text-th-fgd-2">
          {group && mangoAccount
            ? formatFixedDecimals(
                toUiDecimalsForQuote(
                  mangoAccount.getCollateralValue(group)!.toNumber()
                ),
                true
              )
            : '–'}
        </p>
      </div>
      <Slippage />
    </div>
  )
}

export default TradeSummary
