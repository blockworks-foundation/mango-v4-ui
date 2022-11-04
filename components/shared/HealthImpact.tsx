import { HealthType } from '@blockworks-foundation/mango-v4'
import { ArrowRightIcon } from '@heroicons/react/20/solid'
import { useTranslation } from 'next-i18next'
import { useMemo } from 'react'
import mangoStore from '@store/mangoStore'
import Tooltip from './Tooltip'

const HealthImpact = ({
  maintProjectedHealth,
}: {
  maintProjectedHealth: number
}) => {
  const { t } = useTranslation('common')
  const group = mangoStore.getState().group
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)

  const currentMaintHealth = useMemo(() => {
    if (!group || !mangoAccount) return 0
    return mangoAccount.getHealthRatioUi(group, HealthType.maint)
  }, [mangoAccount])

  return (
    <div className="flex flex-wrap items-start justify-between">
      <Tooltip content="Projects the health of your account before you make a trade. The first value is your current account health and the second, your projected account health.">
        <p className="tooltip-underline mr-4 mb-1 text-sm">
          {t('health-impact')}
        </p>
      </Tooltip>
      <div className="flex items-center space-x-2 font-mono">
        <p className="text-th-fgd-1">{currentMaintHealth}%</p>
        <ArrowRightIcon className="h-4 w-4 text-th-fgd-4" />
        <p
          className={
            maintProjectedHealth < 50 && maintProjectedHealth > 15
              ? 'text-th-orange'
              : maintProjectedHealth <= 15
              ? 'text-th-red'
              : 'text-th-green'
          }
        >
          {maintProjectedHealth}%{' '}
          <span
            className={`text-xs ${
              maintProjectedHealth >= currentMaintHealth!
                ? 'text-th-green'
                : 'text-th-red'
            }`}
          >
            ({maintProjectedHealth >= currentMaintHealth! ? '+' : ''}
            {maintProjectedHealth - currentMaintHealth!}%)
          </span>
        </p>
      </div>
    </div>
  )
}

export default HealthImpact
