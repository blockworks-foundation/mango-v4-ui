import { HealthType } from '@blockworks-foundation/mango-v4'
import { ArrowRightIcon } from '@heroicons/react/20/solid'
import { useTranslation } from 'next-i18next'
import { useMemo } from 'react'
import mangoStore from '@store/mangoStore'
import Tooltip from './Tooltip'
import useMangoAccount from 'hooks/useMangoAccount'

const HealthImpact = ({
  maintProjectedHealth,
  small,
}: {
  maintProjectedHealth: number
  small?: boolean
}) => {
  const { t } = useTranslation('common')
  const group = mangoStore.getState().group
  const { mangoAccount } = useMangoAccount()

  const currentMaintHealth = useMemo(() => {
    if (!group || !mangoAccount) return 0
    return mangoAccount.getHealthRatioUi(group, HealthType.maint)
  }, [mangoAccount])

  return (
    <div className="flex flex-wrap items-start justify-between">
      <Tooltip content={t('health-tooltip')} delay={100}>
        <p
          className={`tooltip-underline mr-4 ${small ? 'text-xs' : 'text-sm'}`}
        >
          {t('health-impact')}
        </p>
      </Tooltip>
      {currentMaintHealth ? (
        <div className="flex items-center space-x-1.5 font-mono">
          <p
            className={`font-mono text-th-fgd-2 ${
              small ? 'text-xs' : 'text-sm'
            }`}
          >
            {currentMaintHealth}%
          </p>
          <ArrowRightIcon className="h-4 w-4 text-th-fgd-4" />
          <p
            className={`font-mono ${
              maintProjectedHealth < 50 && maintProjectedHealth > 15
                ? 'text-th-warning'
                : maintProjectedHealth <= 15
                ? 'text-th-down'
                : 'text-th-up'
            } ${small ? 'text-xs' : 'text-sm'}`}
          >
            {maintProjectedHealth}%
          </p>
        </div>
      ) : (
        <span className="text-xs text-th-fgd-2">–</span>
      )}
    </div>
  )
}

export default HealthImpact
