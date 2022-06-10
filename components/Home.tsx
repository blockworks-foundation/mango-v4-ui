import { useWallet } from '@solana/wallet-adapter-react'

import MangoAccount from '../components/MangoAccount'
import Swap from './Swap'

const Home = () => {
  const { connected } = useWallet()

  return (
    <div className="mt-8">
      <div className="flex-col space-y-4">
        <div className="mx-auto flex max-w-xl">
          <div className="w-full space-y-6">
            <Swap />
            {connected ? <MangoAccount /> : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
