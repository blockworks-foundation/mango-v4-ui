import { AnchorProvider, BN } from '@coral-xyz/anchor'
import {
  getAllProposals,
  getGovernanceAccounts,
  getProposal,
  getTokenOwnerRecord,
  getTokenOwnerRecordAddress,
  Governance,
  ProgramAccount,
  Proposal,
  pubkeyFilter,
  Realm,
  TokenOwnerRecord,
} from '@solana/spl-governance'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import produce from 'immer'
import { tryParse } from 'utils/formatting'
import {
  MANGO_GOVERNANCE_PROGRAM,
  MANGO_MINT,
  MANGO_REALM_PK,
  GOVERNANCE_DELEGATE_KEY,
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
    tokenOwnerRecord: ProgramAccount<TokenOwnerRecord> | undefined | null
  }
  delegates: ProgramAccount<TokenOwnerRecord>[]
  set: (x: (x: IGovernanceStore) => void) => void
  initConnection: (connection: Connection) => void
  initRealm: (connectionContext: ConnectionContext) => void
  getCurrentVotingPower: (
    wallet: PublicKey,
    vsrClient: VsrClient,
    connectionContext: ConnectionContext,
  ) => void
  resetVoter: () => void
  updateProposals: (proposalPk: PublicKey) => void
  refetchProposals: () => Promise<Record<string, ProgramAccount<Proposal>>>
  fetchDelegatedAccounts: (
    wallet: PublicKey,
    connectionContext: ConnectionContext,
    programId: PublicKey,
  ) => Promise<ProgramAccount<TokenOwnerRecord>[]>
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
    tokenOwnerRecord: null,
  },
  delegates: [],
  set: (fn) => set(produce(fn)),
  getCurrentVotingPower: async (
    wallet: PublicKey,
    vsrClient: VsrClient,
    connectionContext: ConnectionContext,
  ) => {
    const set = get().set
    const fetchDelegatedAccounts = get().fetchDelegatedAccounts
    let selectedWallet = wallet

    set((state) => {
      state.loadingVoter = true
    })

    const delegatedAccounts = await fetchDelegatedAccounts(
      selectedWallet,
      connectionContext,
      MANGO_GOVERNANCE_PROGRAM,
    )

    const unparsedSelectedDelegatePk = localStorage.getItem(
      `${wallet.toBase58()}${GOVERNANCE_DELEGATE_KEY}`,
    )
    const selectedDelegatePk: string = unparsedSelectedDelegatePk
      ? tryParse(unparsedSelectedDelegatePk)
      : ''

    const selectedDelegate = delegatedAccounts.find(
      (x) => x.pubkey.toBase58() === selectedDelegatePk,
    )

    if (selectedDelegatePk && selectedDelegate) {
      selectedWallet = selectedDelegate.account.governingTokenOwner
    }

    const tokenOwnerRecordPk = await getTokenOwnerRecordAddress(
      MANGO_GOVERNANCE_PROGRAM,
      MANGO_REALM_PK,
      MANGO_MINT,
      selectedWallet,
    )
    let tokenOwnerRecord: ProgramAccount<TokenOwnerRecord> | undefined | null =
      undefined
    try {
      tokenOwnerRecord = await getTokenOwnerRecord(
        connectionContext.current,
        tokenOwnerRecordPk,
      )
      // eslint-disable-next-line no-empty
    } catch (e) {}
    const { votingPower } = await getDeposits({
      realmPk: MANGO_REALM_PK,
      walletPk: selectedWallet,
      communityMintPk: MANGO_MINT,
      client: vsrClient,
      connection: connectionContext.current,
    })
    set((state) => {
      state.voter.voteWeight = votingPower
      state.voter.tokenOwnerRecord = tokenOwnerRecord
      state.loadingVoter = false
    })
  },
  fetchDelegatedAccounts: async (wallet, connectionContext, programId) => {
    const set = get().set
    const governanceDelegateOffset = 122

    const accounts = await getGovernanceAccounts(
      connectionContext.current,
      programId,
      TokenOwnerRecord,
      [pubkeyFilter(governanceDelegateOffset, wallet)!],
    )
    set((state) => {
      state.delegates = accounts.filter((x) =>
        x.account.realm.equals(MANGO_REALM_PK),
      )
    })
    return accounts
  },
  resetVoter: () => {
    const set = get().set
    set((state) => {
      state.voter.voteWeight = new BN(0)
      state.voter.tokenOwnerRecord = null
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
      options,
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
      MANGO_REALM_PK,
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
  refetchProposals: async () => {
    const set = get().set
    const connectionContext = get().connectionContext!
    set((state) => {
      state.loadingProposals = true
    })
    const proposals = await getAllProposals(
      connectionContext.current,
      MANGO_GOVERNANCE_PROGRAM,
      MANGO_REALM_PK,
    )
    const proposalsObj = accountsToPubkeyMap(proposals.flatMap((p) => p))
    set((state) => {
      state.loadingProposals = false
      state.proposals = proposalsObj
    })
    return accountsToPubkeyMap(proposals.flatMap((p) => p))
  },
  updateProposals: async (proposalPk: PublicKey) => {
    const state = get()
    const set = get().set
    set((state) => {
      state.loadingProposals = true
    })
    const proposal = await getProposal(
      state.connectionContext!.current!,
      proposalPk,
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
