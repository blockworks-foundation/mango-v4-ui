import { useWallet } from '@solana/wallet-adapter-react'

import TokenList from './TokenList'
import Swap from './swap/Swap'
import SwapTokenChart from './swap/SwapTokenChart'
import mangoStore from '../store/state'
import MangoAccount from './MangoAccount'

const Home = () => {
  // const { connected } = useWallet()
  const inputTokenInfo = mangoStore((s) => s.inputTokenInfo)
  const outputTokenInfo = mangoStore((s) => s.outputTokenInfo)

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="order-2 col-span-12 space-y-6 md:order-1 md:col-span-6 lg:col-span-8">
        <SwapTokenChart
          inputTokenId={inputTokenInfo?.extensions?.coingeckoId}
          outputTokenId={outputTokenInfo?.extensions?.coingeckoId}
        />
        <TokenList />
      </div>
      <div className="order-1 col-span-12 space-y-6 md:order-2 md:col-span-6 lg:col-span-4">
        <Swap />
        <MangoAccount />
      </div>
    </div>
  )
}

export default Home
