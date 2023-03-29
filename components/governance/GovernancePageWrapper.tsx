import { useWallet } from '@solana/wallet-adapter-react'
import GovernanceStore from '@store/governanceStore'
import mangoStore from '@store/mangoStore'
import { ReactNode, useEffect } from 'react'

const GovernancePageWrapper = ({ children }: { children: ReactNode }) => {
  const { publicKey } = useWallet()
  const {
    initConnection,
    connectionContext,
    initRealm,
    vsrClient,
    fetchVoterWeight,
    realm,
  } = GovernanceStore()
  const { connection } = mangoStore()

  useEffect(() => {
    initConnection(connection)
    console.log('init connection')
  }, [connection.rpcEndpoint])
  useEffect(() => {
    if (connectionContext?.endpoint) {
      initRealm(connectionContext)
      console.log('init realm')
    }
  }, [connectionContext?.endpoint, realm === null])
  useEffect(() => {
    if (publicKey && connectionContext && vsrClient) {
      fetchVoterWeight(publicKey, vsrClient, connectionContext)
      console.log('fetch voter weight')
    }
  }, [
    publicKey?.toBase58(),
    connectionContext?.endpoint,
    vsrClient?.program.programId.toBase58(),
  ])

  return <div>{children}</div>
}
export default GovernancePageWrapper
