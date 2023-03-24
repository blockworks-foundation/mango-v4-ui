import { MintInfo } from '@blockworks-foundation/mango-v4'
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
import { TokenProgramAccount } from './vsrAccounts'
import { u64, MintLayout } from '@solana/spl-token'

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

export async function tryGetMint(
  connection: Connection,
  publicKey: PublicKey
): Promise<TokenProgramAccount<MintInfo> | undefined> {
  try {
    const result = await connection.getAccountInfo(publicKey)
    const data = Buffer.from(result!.data)
    const account = parseMintAccountData(data)
    return {
      publicKey,
      account,
    }
  } catch (ex) {
    console.error(
      `Can't fetch mint ${publicKey?.toBase58()} @ ${connection.rpcEndpoint}`,
      ex
    )
    return undefined
  }
}

export function parseMintAccountData(data: Buffer): MintInfo {
  const mintInfo = MintLayout.decode(data)
  if (mintInfo.mintAuthorityOption === 0) {
    mintInfo.mintAuthority = null
  } else {
    mintInfo.mintAuthority = new PublicKey(mintInfo.mintAuthority)
  }

  mintInfo.supply = u64.fromBuffer(mintInfo.supply)
  mintInfo.isInitialized = mintInfo.isInitialized != 0

  if (mintInfo.freezeAuthorityOption === 0) {
    mintInfo.freezeAuthority = null
  } else {
    mintInfo.freezeAuthority = new PublicKey(mintInfo.freezeAuthority)
  }
  return mintInfo
}
