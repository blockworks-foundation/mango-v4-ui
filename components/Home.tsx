import { useWallet } from '@solana/wallet-adapter-react'

import MangoAccount from '../components/MangoAccount'
import AccountActions from './AccountActions'
import Swap from './swap/Swap'

const Home = () => {
  const { connected } = useWallet()

  return (
    <div className="mt-8">
      <div className="flex-col space-y-4">
        <div className="mx-auto flex max-w-7xl justify-center space-x-4">
          <MangoAccount />
          <div className="space-y-6">
            <Swap />
            {connected ? <AccountActions /> : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
