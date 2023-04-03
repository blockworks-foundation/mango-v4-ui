import { useWallet } from '@solana/wallet-adapter-react'
import GovernanceStore from '@store/governanceStore'
import mangoStore from '@store/mangoStore'
import { ReactNode, useEffect } from 'react'

const GovernancePageWrapper = ({ children }: { children: ReactNode }) => {
  const { publicKey } = useWallet()

  const initConnection = GovernanceStore((s) => s.initConnection)
  const connectionContext = GovernanceStore((s) => s.connectionContext)
  const initRealm = GovernanceStore((s) => s.initRealm)
  const vsrClient = GovernanceStore((s) => s.vsrClient)
  const fetchVoterWeight = GovernanceStore((s) => s.fetchVoterWeight)
  const realm = GovernanceStore((s) => s.realm)
  const connection = mangoStore((s) => s.connection)

  useEffect(() => {
    if (connection.rpcEndpoint) {
      initConnection(connection)
    }
  }, [connection.rpcEndpoint])

  useEffect(() => {
    if (connectionContext?.endpoint && realm === null) {
      initRealm(connectionContext)
    }
  }, [connectionContext?.endpoint, realm === null])

  useEffect(() => {
    if (
      publicKey?.toBase58() &&
      connectionContext?.endpoint &&
      vsrClient?.program.programId.toBase58()
    ) {
      fetchVoterWeight(publicKey, vsrClient, connectionContext)
    }
  }, [
    publicKey?.toBase58(),
    connectionContext?.endpoint,
    vsrClient?.program.programId.toBase58(),
  ])

  return (
    <div className="grid grid-cols-12">
      <div className="col-span-12 lg:col-span-8 lg:col-start-3">{children}</div>
    </div>
  )
}
export default GovernancePageWrapper
