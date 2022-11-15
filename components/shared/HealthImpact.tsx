import { HealthType } from '@blockworks-foundation/mango-v4'
import { ArrowRightIcon } from '@heroicons/react/20/solid'
import { useTranslation } from 'next-i18next'
import { useMemo } from 'react'
import mangoStore from '@store/mangoStore'
import Tooltip from './Tooltip'

const HealthImpact = ({
  maintProjectedHealth,
  responsive,
}: {
  maintProjectedHealth: number
  responsive?: boolean
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
      <Tooltip content={t('health-tooltip')}>
        <p
          className={`tooltip-underline mr-4 mb-1 ${
            responsive ? 'text-xs lg:text-sm' : ''
          }`}
        >
          {t('health-impact')}
        </p>
      </Tooltip>
      <div className="flex items-center space-x-1.5 font-mono">
        <p
          className={`text-th-fgd-1 ${responsive ? 'text-xs lg:text-sm' : ''}`}
        >
          {currentMaintHealth}%
        </p>
        <ArrowRightIcon className="h-4 w-4 text-th-fgd-4" />
        <p
          className={`${
            maintProjectedHealth < 50 && maintProjectedHealth > 15
              ? 'text-th-orange'
              : maintProjectedHealth <= 15
              ? 'text-th-red'
              : 'text-th-green'
          } ${responsive ? 'text-xs lg:text-sm' : ''}`}
        >
          {maintProjectedHealth}%
        </p>
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
      </div>
    </div>
  )
}

export default HealthImpact
