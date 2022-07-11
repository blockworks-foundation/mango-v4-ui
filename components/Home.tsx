import { useWallet } from '@solana/wallet-adapter-react'

import TokenList from './TokenList'
import AccountActions from './AccountActions'
import Swap from './swap/Swap'
import SwapTokenChart from './swap/SwapTokenChart'
import mangoStore from '../store/state'

const Home = () => {
  const { connected } = useWallet()
  const inputTokenInfo = mangoStore((s) => s.inputTokenInfo)
  const outputTokenInfo = mangoStore((s) => s.outputTokenInfo)

  return (
    <div className="mt-8">
      <div className="flex-col space-y-4">
        <div className="mx-auto flex max-w-7xl justify-center space-x-4">
          <div className="w-full space-y-6">
            <SwapTokenChart
              inputTokenId={inputTokenInfo?.extensions?.coingeckoId}
              outputTokenId={outputTokenInfo?.extensions?.coingeckoId}
            />
            <TokenList />
          </div>
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
