import { useWallet } from '@solana/wallet-adapter-react'

import TokenList from './TokenList'
import Swap from './swap/Swap'
import SwapTokenChart from './swap/SwapTokenChart'
import mangoStore from '../store/state'
import MangoAccount from './MangoAccount'

const Home = () => {
  const { connected } = useWallet()
  const inputTokenInfo = mangoStore((s) => s.inputTokenInfo)
  const outputTokenInfo = mangoStore((s) => s.outputTokenInfo)

  return (
    <div className="mt-12">
      <div className="">
        <div className="mx-auto flex max-w-7xl justify-center space-x-6">
          <div className="flex-grow space-y-6">
            <SwapTokenChart
              inputTokenId={inputTokenInfo?.extensions?.coingeckoId}
              outputTokenId={outputTokenInfo?.extensions?.coingeckoId}
            />
            <TokenList />
          </div>
          <div className="space-y-6">
            <Swap />
            <MangoAccount />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
