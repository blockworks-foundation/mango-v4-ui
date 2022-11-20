import { MangoAccount } from '@blockworks-foundation/mango-v4'
import mangoStore from '@store/mangoStore'

export default function useMangoAccount(): {
  mangoAccount: MangoAccount | undefined
  initialLoad: boolean
} {
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)
  const initialLoad = mangoStore((s) => s.mangoAccount.initialLoad)

  return { mangoAccount, initialLoad }
}
