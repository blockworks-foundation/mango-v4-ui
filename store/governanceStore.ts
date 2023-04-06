import { AnchorProvider, BN } from '@project-serum/anchor'
import {
  getAllProposals,
  getProposal,
  getTokenOwnerRecord,
  getTokenOwnerRecordAddress,
  Governance,
  ProgramAccount,
  Proposal,
  Realm,
  TokenOwnerRecord,
} from '@solana/spl-governance'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import produce from 'immer'
import {
  MANGO_GOVERNANCE_PROGRAM,
  MANGO_MINT,
  MANGO_REALM_PK,
} from 'utils/governance/constants'
import { getDeposits } from 'utils/governance/fetch/deposits'
import {
  accountsToPubkeyMap,
  fetchGovernances,
  fetchRealm,
} from 'utils/governance/tools'
import { ConnectionContext, EndpointTypes } from 'utils/governance/types'
import {
  DEFAULT_VSR_ID,
  VsrClient,
} from 'utils/governance/voteStakeRegistryClient'
import EmptyWallet from 'utils/wallet'
import create from 'zustand'

type IGovernanceStore = {
  connectionContext: ConnectionContext | null
  realm: ProgramAccount<Realm> | null
  governances: Record<string, ProgramAccount<Governance>> | null
  proposals: Record<string, ProgramAccount<Proposal>> | null
  vsrClient: VsrClient | null
  loadingRealm: boolean
  loadingVoter: boolean
  loadingProposals: boolean
  voter: {
    voteWeight: BN
    wallet: PublicKey
    tokenOwnerRecord: ProgramAccount<TokenOwnerRecord> | undefined | null
  }
  set: (x: (x: IGovernanceStore) => void) => void
  initConnection: (connection: Connection) => void
  initRealm: (connectionContext: ConnectionContext) => void
  fetchVoterWeight: (
    wallet: PublicKey,
    vsrClient: VsrClient,
    connectionContext: ConnectionContext
  ) => void
  updateProposals: (proposalPk: PublicKey) => void
}

const GovernanceStore = create<IGovernanceStore>((set, get) => ({
  connectionContext: null,
  realm: null,
  governances: null,
  proposals: null,
  vsrClient: null,
  loadingRealm: false,
  loadingVoter: false,
  loadingProposals: false,
  voter: {
    voteWeight: new BN(0),
    wallet: PublicKey.default,
    tokenOwnerRecord: null,
  },
  set: (fn) => set(produce(fn)),
  fetchVoterWeight: async (
    wallet: PublicKey,
    vsrClient: VsrClient,
    connectionContext: ConnectionContext
  ) => {
    const set = get().set
    set((state) => {
      state.loadingVoter = true
    })
    const tokenOwnerRecordPk = await getTokenOwnerRecordAddress(
      MANGO_GOVERNANCE_PROGRAM,
      MANGO_REALM_PK,
      MANGO_MINT,
      wallet
    )
    let tokenOwnerRecord: ProgramAccount<TokenOwnerRecord> | undefined | null =
      undefined
    try {
      tokenOwnerRecord = await getTokenOwnerRecord(
        connectionContext.current,
        tokenOwnerRecordPk
      )
      // eslint-disable-next-line no-empty
    } catch (e) {}
    const { votingPower } = await getDeposits({
      realmPk: MANGO_REALM_PK,
      walletPk: wallet,
      communityMintPk: MANGO_MINT,
      client: vsrClient,
      connection: connectionContext.current,
    })
    set((state) => {
      state.voter.voteWeight = votingPower
      state.voter.wallet = wallet
      state.voter.tokenOwnerRecord = tokenOwnerRecord
      state.loadingVoter = false
    })
  },
  initConnection: async (connection) => {
    const set = get().set
    const connectionContext = {
      cluster: connection.rpcEndpoint.includes('devnet')
        ? 'devnet'
        : ('mainnet' as EndpointTypes),
      current: connection,
      endpoint: connection.rpcEndpoint,
    }
    const options = AnchorProvider.defaultOptions()
    const provider = new AnchorProvider(
      connection,
      new EmptyWallet(Keypair.generate()),
      options
    )
    const vsrClient = await VsrClient.connect(provider, DEFAULT_VSR_ID)
    set((state) => {
      state.vsrClient = vsrClient
      state.connectionContext = connectionContext
    })
  },
  initRealm: async (connectionContext) => {
    const set = get().set
    set((state) => {
      state.loadingRealm = true
    })
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
    set((state) => {
      state.loadingProposals = true
    })
    const proposals = await getAllProposals(
      connectionContext.current,
      MANGO_GOVERNANCE_PROGRAM,
      MANGO_REALM_PK
    )
    const proposalsObj = accountsToPubkeyMap(proposals.flatMap((p) => p))
    set((state) => {
      state.loadingProposals = false
      state.realm = realm
      state.governances = governances
      state.proposals = proposalsObj
      state.loadingRealm = false
    })
  },
  updateProposals: async (proposalPk: PublicKey) => {
    const state = get()
    const set = get().set
    set((state) => {
      state.loadingProposals = true
    })
    const proposal = await getProposal(
      state.connectionContext!.current!,
      proposalPk
    )
    const newProposals = { ...state.proposals }
    newProposals[proposal.pubkey.toBase58()] = proposal
    set((state) => {
      state.proposals = newProposals
      state.loadingProposals = false
    })
  },
}))

export default GovernanceStore
