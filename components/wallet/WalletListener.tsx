import { useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import mangoStore from '../../store/state'
import { Wallet } from '@project-serum/anchor'

const WalletListener = () => {
  const group = mangoStore((s) => s.group)
  const { wallet, connected, disconnecting } = useWallet()

  useEffect(() => {
    const actions = mangoStore.getState().actions

    const onConnect = async () => {
      if (!wallet) return
      actions.fetchMangoAccount(wallet.adapter as unknown as Wallet)
    }

    if (connected && group) {
      onConnect()
    }
  }, [wallet, connected, group])

  useEffect(() => {
    const setStore = mangoStore.getState().set

    if (disconnecting) {
      setStore((state) => {
        state.mangoAccount = undefined
      })
    }
  }, [disconnecting])

  return null
}

export default WalletListener
