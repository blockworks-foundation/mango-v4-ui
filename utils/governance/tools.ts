import {
  getGovernanceAccounts,
  getRealm,
  Governance,
  ProgramAccount,
  pubkeyFilter,
} from '@solana/spl-governance'
import { Connection, PublicKey } from '@solana/web3.js'
import { getProposals } from './getProposals'
import { ConnectionContext } from './types'

export async function fetchRealm({
  connection,
  realmId,
}: {
  connection: Connection
  realmId: PublicKey
}) {
  const realm = await getRealm(connection, realmId)
  return realm
}
export async function fetchGovernances({
  connection,
  realmId,
  programId,
}: {
  connection: Connection
  realmId: PublicKey
  programId: PublicKey
}) {
  console.log('Fetching governances...')
  const governances = await getGovernanceAccounts(
    connection,
    programId,
    Governance,
    [pubkeyFilter(1, realmId)!]
  )
  const governancesMap = accountsToPubkeyMap(governances)
  return governancesMap
}
export async function fetchProposals({
  connectionContext,
  programId,
  governances,
}: {
  connectionContext: ConnectionContext
  programId: PublicKey
  governances: PublicKey[]
}) {
  const proposalsByGovernance = await getProposals(
    governances,
    connectionContext,
    programId
  )

  const proposals = accountsToPubkeyMap(proposalsByGovernance.flatMap((p) => p))
  return proposals
}

export function accountsToPubkeyMap<T>(accounts: ProgramAccount<T>[]) {
  return arrayToRecord(accounts, (a) => a.pubkey.toBase58())
}

export function arrayToRecord<T>(
  source: readonly T[],
  getKey: (item: T) => string
) {
  return source.reduce((all, a) => ({ ...all, [getKey(a)]: a }), {}) as Record<
    string,
    T
  >
}
