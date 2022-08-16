import { useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import mangoStore from '../../store/state'
import { Wallet } from '@project-serum/anchor'

const WalletListener = () => {
  const { wallet, connected, disconnecting } = useWallet()
  const loadingMangoAccounts = mangoStore((s) => s.mangoAccounts.loading)
  const mangoAccounts = mangoStore((s) => s.mangoAccounts.accounts)

  useEffect(() => {
    const actions = mangoStore.getState().actions
    const set = mangoStore.getState().set

    const onConnect = async () => {
      if (!wallet) return
      await actions.fetchMangoAccounts(wallet.adapter as unknown as Wallet)
      if (mangoAccounts.length) {
        actions.fetchMangoAccount(
          wallet.adapter as unknown as Wallet,
          mangoAccounts[0].accountNum
        )
      } else {
        if (!loadingMangoAccounts) {
          set((s) => {
            s.mangoAccount.loading = false
          })
        }
      }
      actions.fetchProfilePicture(wallet.adapter as unknown as Wallet)
      actions.fetchWalletTokens(wallet.adapter as unknown as Wallet)
    }
    console.log('connected', connected)

    if (connected) {
      onConnect()
    }
  }, [wallet, connected, loadingMangoAccounts, mangoAccounts.length])

  useEffect(() => {
    const setStore = mangoStore.getState().set
    if (disconnecting) {
      setStore((state) => {
        state.mangoAccount.current = undefined
      })
    }
  }, [disconnecting])

  return null
}

export default WalletListener
