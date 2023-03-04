import { useWallet } from '@solana/wallet-adapter-react'
import { useMemo } from 'react'
import useMangoAccount from './useMangoAccount'

const useUnownedAccount = (): {
  isUnownedAccount: boolean
  isDelegatedAccount: boolean
} => {
  const { connected, publicKey } = useWallet()
  const { mangoAccountAddress, mangoAccount } = useMangoAccount()

  const isUnownedAccount = useMemo(() => {
    if (connected) return false
    return mangoAccountAddress && !connected ? true : false
  }, [connected, mangoAccountAddress])

  const isDelegatedAccount: boolean = useMemo(() => {
    if (publicKey && mangoAccount) {
      return mangoAccount?.delegate.equals(publicKey)
    }
    return false
  }, [publicKey, mangoAccount])

  return { isUnownedAccount, isDelegatedAccount }
}

export default useUnownedAccount
