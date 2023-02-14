import { useWallet } from '@solana/wallet-adapter-react'
import { useMemo } from 'react'
import useMangoAccount from './useMangoAccount'

const useUnownedAccount = () => {
  const { connected } = useWallet()
  const { mangoAccountAddress } = useMangoAccount()

  const isUnownedAccount = useMemo(() => {
    if (connected) return false
    return mangoAccountAddress && !connected
  }, [connected, mangoAccountAddress])

  return isUnownedAccount
}

export default useUnownedAccount
