import {
  Governance,
  ProgramAccount,
  Proposal,
  Realm,
} from '@solana/spl-governance'
import { Connection, PublicKey } from '@solana/web3.js'
import produce from 'immer'
import {
  MANGO_GOVERNANCE_PROGRAM,
  MANGO_REALM_PK,
} from 'utils/governance/constants'
import {
  fetchGovernances,
  fetchProposals,
  fetchRealm,
} from 'utils/governance/tools'
import { ConnectionContext, EndpointTypes } from 'utils/governance/types'
import { VsrClient } from 'utils/governance/voteStakeRegistryClient'
import create from 'zustand'

type IGovernanceStore = {
  connectionContext: ConnectionContext | null
  realm: ProgramAccount<Realm> | null
  governances: Record<string, ProgramAccount<Governance>> | null
  proposals: Record<string, ProgramAccount<Proposal>> | null
  vsrClient: VsrClient | null
  loadingRealm: boolean
  set: (x: (x: IGovernanceStore) => void) => void
  initConnection: (connection: Connection) => void
  initRealm: () => void
}

const GovernanceStore = create<IGovernanceStore>((set, get) => ({
  connectionContext: null,
  realm: null,
  governances: null,
  proposals: null,
  vsrClient: null,
  loadingRealm: false,
  set: (fn) => set(produce(fn)),
  initConnection: async (connection) => {
    const set = get().set
    const connectionContext = {
      cluster: connection.rpcEndpoint.includes('devnet')
        ? 'devnet'
        : ('mainnet' as EndpointTypes),
      current: connection,
      endpoint: connection.rpcEndpoint,
    }
    set((state) => {
      state.connectionContext = connectionContext
    })
  },
  initRealm: async () => {
    const state = get()
    const set = get().set
    const connectionContext = state.connectionContext!
    const [realm, governances] = await Promise.all([
      fetchRealm({
        connection: connectionContext.current,
        realmId: MANGO_REALM_PK,
      }),
      fetchGovernances({
        connection: connectionContext.current,
        programId: MANGO_GOVERNANCE_PROGRAM,
        realmId: MANGO_REALM_PK,
      }),
    ])
    const proposals = await fetchProposals({
      connectionContext: connectionContext,
      programId: MANGO_GOVERNANCE_PROGRAM,
      governances: Object.keys(governances).map((x) => new PublicKey(x)),
    })
    set((state) => {
      state.realm = realm
      state.governances = governances
      state.proposals = proposals
    })
  },
}))

export default GovernanceStore
