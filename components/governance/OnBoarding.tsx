import { useWallet } from '@solana/wallet-adapter-react'
import { ReactNode } from 'react'

const OnBoarding = ({ children }: { children: ReactNode }) => {
  const { connected, publicKey } = useWallet()
  console.log(publicKey)
  const View = () => {
    if (connected) {
      return <div>{children}</div>
    } else {
      return <div>Please connect your wallet</div>
    }
  }
  return <View></View>
}
export default OnBoarding
