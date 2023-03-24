import { Connection } from '@solana/web3.js'

export type EndpointTypes = 'mainnet' | 'devnet' | 'localnet'

export type ConnectionContext = {
  cluster: EndpointTypes
  current: Connection
  endpoint: string
}
