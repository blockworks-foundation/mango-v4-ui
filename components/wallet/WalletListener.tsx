import { useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import mangoStore from '../../store/state'
import { Wallet as AnchorWallet, Wallet } from '@project-serum/anchor'

const WalletListener = () => {
  const actions = mangoStore((s) => s.actions)
  const { wallet, publicKey } = useWallet()

  useEffect(() => {
    const onConnect = async () => {
      if (!wallet) return
      console.log('onConnect pk:', publicKey)
      actions.connectWallet(wallet.adapter as unknown as Wallet)
    }

    if (publicKey) {
      onConnect()
    }
  }, [wallet?.adapter, publicKey])

  return null
}

export default WalletListener
