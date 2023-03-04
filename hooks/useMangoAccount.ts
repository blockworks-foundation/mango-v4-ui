import { MangoAccount } from '@blockworks-foundation/mango-v4'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import mangoStore from '@store/mangoStore'
import { useMemo } from 'react'

export default function useMangoAccount(): {
  mangoAccount: MangoAccount | undefined
  initialLoad: boolean
  mangoAccountPk: PublicKey | undefined
  mangoAccountAddress: string
  isDelegatedAccount: boolean
} {
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)
  const initialLoad = mangoStore((s) => s.mangoAccount.initialLoad)
  const { publicKey } = useWallet()

  const mangoAccountPk = useMemo(() => {
    return mangoAccount?.publicKey
  }, [mangoAccount?.publicKey])

  const mangoAccountAddress = useMemo(() => {
    return mangoAccountPk?.toString() || ''
  }, [mangoAccountPk])

  const isDelegatedAccount: boolean = useMemo(() => {
    if (publicKey && mangoAccount) {
      return mangoAccount?.delegate.equals(publicKey)
    }
    return false
  }, [publicKey, mangoAccount])

  return {
    mangoAccount,
    initialLoad,
    mangoAccountAddress,
    mangoAccountPk,
    isDelegatedAccount,
  }
}
