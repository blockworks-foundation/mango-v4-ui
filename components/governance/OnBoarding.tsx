import Loading from '@components/shared/Loading'
import { useWallet } from '@solana/wallet-adapter-react'
import GovernanceStore from '@store/governanceStore'
import mangoStore from '@store/mangoStore'
import { ReactNode, useEffect } from 'react'

const OnBoarding = ({ children }: { children: ReactNode }) => {
  const { connected, publicKey } = useWallet()
  const {
    initConnection,
    connectionContext,
    initRealm,
    vsrClient,
    loadingRealm,
    loadingVoter,
    fetchVoterWeight,
  } = GovernanceStore()
  const { connection } = mangoStore()

  useEffect(() => {
    initConnection(connection)
    console.log('init connection')
  }, [connection.rpcEndpoint])
  useEffect(() => {
    if (connectionContext && connected) {
      initRealm(connectionContext)
      console.log('init realm')
    }
  }, [connectionContext?.endpoint, connected])
  useEffect(() => {
    if (publicKey && connectionContext && vsrClient) {
      fetchVoterWeight(publicKey, vsrClient, connectionContext)
      console.log('init voter weight')
    }
  }, [publicKey, connectionContext?.endpoint, vsrClient?.program.programId])

  const View = () => {
    if (loadingRealm || loadingVoter) {
      return <Loading className="mr-2 h-5 w-5" />
    }
    if (connected) {
      return <div>{children}</div>
    } else {
      return <div>Please connect your wallet</div>
    }
  }
  return <View></View>
}
export default OnBoarding
