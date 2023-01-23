import mangoStore from '@store/mangoStore'
import {
  HealthType,
  toUiDecimalsForQuote,
} from '@blockworks-foundation/mango-v4'
import { formatFixedDecimals } from '../../utils/numbers'
import { useTranslation } from 'next-i18next'
import useMangoAccount from 'hooks/useMangoAccount'
import useMangoGroup from 'hooks/useMangoGroup'
import { useMemo } from 'react'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { HIDE_ACCOUNT_VALUE_KEY, HIDE_PNL_KEY } from 'utils/constants'

const SummaryItem = ({ label, value }: { label: string; value: string }) => {
  return (
    <div>
      <p className="text-sm text-th-fgd-3">{label}</p>
      <p className="font-mono text-sm text-th-fgd-1">{value}</p>
    </div>
  )
}

const MangoAccountSummary = () => {
  const { t } = useTranslation('common')
  const { group } = useMangoGroup()
  const { mangoAccount } = useMangoAccount()
  const performanceData = mangoStore((s) => s.mangoAccount.performance.data)
  const [hideAccountValue] = useLocalStorageState(HIDE_ACCOUNT_VALUE_KEY, true)
  const [hidePnl] = useLocalStorageState(HIDE_PNL_KEY, true)

  const [accountValue, freeCollateral, health] = useMemo(() => {
    if (!group || !mangoAccount) return [0, 0, 0]
    const accountValue = toUiDecimalsForQuote(
      mangoAccount.getEquity(group).toNumber()
    )
    const freeCollateral = toUiDecimalsForQuote(
      mangoAccount.getCollateralValue(group).toNumber()
    )
    const health = mangoAccount.getHealthRatioUi(group, HealthType.maint)
    return [accountValue, freeCollateral, health]
  }, [group, mangoAccount])

  const leverage = useMemo(() => {
    if (!group || !mangoAccount) return 0
    const assetsValue = toUiDecimalsForQuote(
      mangoAccount.getAssetsValue(group).toNumber()
    )

    if (isNaN(assetsValue / accountValue)) {
      return 0
    } else {
      return Math.abs(1 - assetsValue / accountValue)
    }
  }, [mangoAccount, group, accountValue])

  const pnl = useMemo(() => {
    if (!performanceData.length) return 0
    return performanceData[performanceData.length - 1].pnl
  }, [performanceData])

  return (
    <div className="space-y-2">
      <SummaryItem
        label={t('account-value')}
        value={
          !hideAccountValue
            ? formatFixedDecimals(accountValue, true, true)
            : '*****'
        }
      />
      <SummaryItem label={t('health')} value={`${health}%`} />
      <SummaryItem
        label={t('free-collateral')}
        value={formatFixedDecimals(freeCollateral, true, true)}
      />
      <SummaryItem label={t('leverage')} value={`${leverage.toFixed(2)}x`} />
      <SummaryItem
        label={t('pnl')}
        value={!hidePnl ? formatFixedDecimals(pnl, true, true) : '*****'}
      />
    </div>
  )
}

export default MangoAccountSummary
