import { HealthType } from '@blockworks-foundation/mango-v4'
import { PublicKey } from '@solana/web3.js'
import { useMemo } from 'react'
import mangoStore from '@store/mangoStore'
import HealthImpact from './shared/HealthImpact'

const HealthImpactTokenChange = ({
  uiAmount,
  isDeposit,
  mintPk,
}: {
  uiAmount: number
  isDeposit?: boolean
  mintPk: PublicKey
}) => {
  const maintProjectedHealth = useMemo(() => {
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const group = mangoStore.getState().group
    if (!group || !mangoAccount) return 0
    const uiTokenAmount = isDeposit ? uiAmount : uiAmount * -1

    const projectedHealth =
      mangoAccount.simHealthRatioWithTokenPositionUiChanges(
        group,
        [{ mintPk, uiTokenAmount }],
        HealthType.maint,
      )

    return projectedHealth! > 100
      ? 100
      : projectedHealth! < 0
      ? 0
      : Math.trunc(projectedHealth!)
  }, [mintPk, uiAmount, isDeposit])

  return <HealthImpact maintProjectedHealth={maintProjectedHealth} />
}

export default HealthImpactTokenChange
