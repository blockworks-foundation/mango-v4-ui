// Default styles that can be overridden by your app
require('@solana/wallet-adapter-react-ui/styles.css')
import { useWallet } from '@solana/wallet-adapter-react'
import {
  WalletDisconnectButton,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui'
import MenuItem from './shared/MenuItem'

const TopBar = () => {
  const { connected } = useWallet()

  return (
    <>
      <div className="flex w-full justify-between p-2">
        <div className="ml-4 flex space-x-4">
          <MenuItem href="/">Home</MenuItem>
          {/* <MenuItem href="/swap">Swap</MenuItem> */}
        </div>

        <div className="flex">
          {connected ? <WalletDisconnectButton /> : <WalletMultiButton />}
        </div>
      </div>
    </>
  )
}

export default TopBar
