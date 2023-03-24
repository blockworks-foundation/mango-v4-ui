import Loading from '@components/shared/Loading'
import { useWallet } from '@solana/wallet-adapter-react'
import GovernanceStore from '@store/governanceStore'
import mangoStore from '@store/mangoStore'
import { ReactNode, useEffect } from 'react'
import OnBoarding from './onBoarding'

const OnBoardingWrapper = ({ children }: { children: ReactNode }) => {
  const { connected, publicKey } = useWallet()
  const {
    initConnection,
    connectionContext,
    initRealm,
    vsrClient,
    loadingRealm,
    loadingVoter,
    fetchVoterWeight,
    voter,
    realm,
  } = GovernanceStore()
  const { connection } = mangoStore()

  useEffect(() => {
    initConnection(connection)
  }, [connection.rpcEndpoint])
  useEffect(() => {
    if (connectionContext && connected) {
      initRealm(connectionContext)
    }
  }, [connectionContext?.endpoint, connected, realm === null])
  useEffect(() => {
    if (publicKey && connectionContext && vsrClient) {
      fetchVoterWeight(publicKey, vsrClient, connectionContext)
    }
  }, [
    publicKey?.toBase58(),
    connectionContext?.endpoint,
    vsrClient?.program.programId.toBase58(),
  ])

  const View = () => {
    if (loadingRealm || loadingVoter) {
      return <Loading className="mr-2 h-5 w-5" />
    }
    if (connected) {
      if (voter.voteWeight.isZero()) {
        return <OnBoarding></OnBoarding>
      } else {
        return <div>{children}</div>
      }
    } else {
      return <div>Please connect your wallet</div>
    }
  }
  return <View></View>
}
export default OnBoardingWrapper
