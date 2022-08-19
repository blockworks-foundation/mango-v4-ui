import { HealthType, toNativeDecimals } from '@blockworks-foundation/mango-v4'
import { ArrowRightIcon } from '@heroicons/react/solid'
import { PublicKey } from '@solana/web3.js'
import { useTranslation } from 'next-i18next'
import { useMemo } from 'react'
import mangoStore from '../../store/state'

const HealthImpact = ({
  uiAmount,
  isDeposit,
  mintPk,
}: {
  uiAmount: number
  isDeposit?: boolean
  mintPk: PublicKey
}) => {
  const { t } = useTranslation('common')
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)

  const currentHealth = useMemo(() => {
    if (!mangoAccount) return 0
    return mangoAccount.getHealthRatioUi(HealthType.maint)
  }, [mangoAccount])

  const projectedHealth = useMemo(() => {
    const group = mangoStore.getState().group
    if (!group || !mangoAccount) return 0
    const amount = group.toNativeDecimals(uiAmount, mintPk).toNumber();
    const projectedHealth = mangoAccount
      .simHealthRatioWithTokenPositionChanges(group, [
        { mintPk, tokenAmount: isDeposit ? amount : amount * -1 },
      ], HealthType.maint)
      .toNumber()

    return projectedHealth > 100
      ? 100
      : projectedHealth < 0
      ? 0
      : projectedHealth
  }, [mangoAccount, mintPk, uiAmount, isDeposit])

  return (
    <div className="space-y-2 border-y border-th-bkg-3 px-2 py-4">
      <div className="flex justify-between">
        <p>{t('health-impact')}</p>
        <div className="flex items-center space-x-2">
          <p className="text-th-fgd-1">{currentHealth}%</p>
          <ArrowRightIcon className="h-4 w-4 text-th-fgd-3" />
          <p
            className={
              projectedHealth < 50 && projectedHealth > 15
                ? 'text-th-orange'
                : projectedHealth <= 15
                ? 'text-th-red'
                : 'text-th-green'
            }
          >
            {projectedHealth.toFixed(2)}%{' '}
            <span
              className={`text-xs ${
                projectedHealth >= currentHealth
                  ? 'text-th-green'
                  : 'text-th-red'
              }`}
            >
              ({(projectedHealth - currentHealth).toFixed(2)}%)
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default HealthImpact
