import { HealthType } from 'mango-v4-test-pack'
import mangoStore from '@store/mangoStore'
import { useMemo } from 'react'
import useMangoAccount from './useMangoAccount'

export default function useHealthContributions() {
  const { mangoAccount } = useMangoAccount()

  const [initContributions, maintContributions] = useMemo(() => {
    const group = mangoStore.getState().group
    if (!mangoAccount || !group) return [[], []]
    const init = mangoAccount.getHealthContributionPerAssetUi(
      group,
      HealthType.init,
    )
    const maint = mangoAccount.getHealthContributionPerAssetUi(
      group,
      HealthType.maint,
    )
    return [init, maint]
  }, [mangoAccount])

  return { initContributions, maintContributions }
}
