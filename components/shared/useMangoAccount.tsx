import { MangoAccount } from '@blockworks-foundation/mango-v4'
import mangoStore from '../../store/mangoStore'

export default function useMangoAccount(): {
  mangoAccount: MangoAccount | undefined
  initialLoad: boolean
} {
  const { mangoAccount, initialLoad } = mangoStore((state) => ({
    mangoAccount: state.mangoAccount.current,
    lastUpdatedAt: state.mangoAccount.lastUpdatedAt,
    initialLoad: state.mangoAccount.initialLoad,
  }))

  return { mangoAccount, initialLoad }
}
