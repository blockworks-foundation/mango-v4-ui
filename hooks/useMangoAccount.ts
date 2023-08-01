import { MangoAccount } from '@blockworks-foundation/mango-v4'
import { PublicKey } from '@solana/web3.js'
import mangoStore from '@store/mangoStore'
import { useMemo } from 'react'

export default function useMangoAccount(): {
  mangoAccount: MangoAccount | undefined
  initialLoad: boolean
  mangoAccountPk: PublicKey | undefined
  mangoAccountAddress: string
} {
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)

  const initialLoad = mangoStore((s) => s.mangoAccount.initialLoad)

  const mangoAccountPk = useMemo(() => {
    return mangoAccount?.publicKey
  }, [mangoAccount?.publicKey])

  const mangoAccountAddress = useMemo(() => {
    return mangoAccountPk?.toString() || ''
  }, [mangoAccountPk])

  return {
    mangoAccount,
    initialLoad,
    mangoAccountAddress,
    mangoAccountPk,
  }
}
