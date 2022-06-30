import { useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import mangoStore from '../../store/state'
import { Wallet } from '@project-serum/anchor'

const WalletListener = () => {
  const { wallet, connected, disconnecting } = useWallet()

  useEffect(() => {
    const actions = mangoStore.getState().actions

    const onConnect = async () => {
      if (!wallet) return
      actions.fetchMangoAccount(wallet.adapter as unknown as Wallet)
    }
    console.log('connected', connected)

    if (connected) {
      onConnect()
    }
  }, [wallet, connected])

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
