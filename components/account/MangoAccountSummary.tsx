import {
  HealthType,
  toUiDecimalsForQuote,
} from '@blockworks-foundation/mango-v4'
import { useTranslation } from 'next-i18next'
import useMangoAccount from 'hooks/useMangoAccount'
import useMangoGroup from 'hooks/useMangoGroup'
import { useMemo } from 'react'
import FormatNumericValue from '@components/shared/FormatNumericValue'

const SummaryItem = ({
  label,
  value,
  isUsd,
  suffix,
}: {
  label: string
  value: number
  isUsd?: boolean
  suffix?: string
}) => {
  return (
    <div>
      <p className="text-sm text-th-fgd-3">{label}</p>
      <p className="font-mono text-sm text-th-fgd-1">
        <FormatNumericValue value={value} decimals={2} isUsd={isUsd} />
        {suffix}
      </p>
    </div>
  )
}

const MangoAccountSummary = () => {
  const { t } = useTranslation('common')
  const { group } = useMangoGroup()
  const { mangoAccount } = useMangoAccount()

  const [accountPnl, accountValue, freeCollateral, health] = useMemo(() => {
    if (!group || !mangoAccount) return [0, 0, 0, 0]
    const accountPnl = toUiDecimalsForQuote(
      mangoAccount.getPnl(group).toNumber(),
    )
    const accountValue = toUiDecimalsForQuote(
      mangoAccount.getEquity(group).toNumber(),
    )
    const freeCollateral = toUiDecimalsForQuote(
      mangoAccount.getCollateralValue(group).toNumber(),
    )
    const health = mangoAccount.getHealthRatioUi(group, HealthType.maint)
    return [accountPnl, accountValue, freeCollateral, health]
  }, [group, mangoAccount])

  const leverage = useMemo(() => {
    if (!group || !mangoAccount) return 0
    const assetsValue = toUiDecimalsForQuote(
      mangoAccount.getAssetsValue(group).toNumber(),
    )

    if (isNaN(assetsValue / accountValue)) {
      return 0
    } else {
      return Math.abs(1 - assetsValue / accountValue)
    }
  }, [mangoAccount, group, accountValue])

  return (
    <div className="space-y-2">
      <SummaryItem label={t('account-value')} value={accountValue} isUsd />
      <SummaryItem label={t('health')} value={health} suffix="%" />
      <SummaryItem label={t('free-collateral')} value={freeCollateral} isUsd />
      <SummaryItem label={t('leverage')} value={leverage} suffix="x" />
      <SummaryItem label={t('pnl')} value={accountPnl} isUsd />
    </div>
  )
}

export default MangoAccountSummary
