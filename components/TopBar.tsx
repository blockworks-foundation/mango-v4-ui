// Default styles that can be overridden by your app
require('@solana/wallet-adapter-react-ui/styles.css')
import { useWallet } from '@solana/wallet-adapter-react'
import {
  WalletDisconnectButton,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui'
import Image from 'next/image'
import MenuItem from './shared/MenuItem'

const TopBar = () => {
  const { connected } = useWallet()

  return (
    <div className="">
      <div className="mx-auto flex max-w-7xl justify-between p-2 pt-8">
        <div className="flex w-full justify-start">
          <div className={`flex items-center justify-between`}>
            <Image src="/icons/logo.svg" alt="next" height="40" width="40" />
          </div>
        </div>
        <div className="flex w-full justify-center">
          <div className="ml-4 flex space-x-4">
            <MenuItem href="/">Home</MenuItem>
            <MenuItem href="/testing">Testing</MenuItem>
          </div>
        </div>
        <div className="flex w-full justify-end">
          <div className="flex">
            {connected ? <WalletDisconnectButton /> : <WalletMultiButton />}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TopBar
