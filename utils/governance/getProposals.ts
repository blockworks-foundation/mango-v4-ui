import { bs58 } from '@project-serum/anchor/dist/cjs/utils/bytes'
import {
  deserializeBorsh,
  getGovernanceSchemaForAccount,
  GovernanceAccountType,
  ProgramAccount,
  Proposal,
} from '@solana/spl-governance'
import { PublicKey } from '@solana/web3.js'
import { ConnectionContext } from './types'

export const getProposals = async (
  pubkeys: PublicKey[],
  connection: ConnectionContext,
  programId: PublicKey
) => {
  const proposalsRaw = await fetch(connection.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      ...pubkeys.map((x) => {
        return getProposalsFilter(
          programId,
          connection,
          bs58.encode(Uint8Array.from([GovernanceAccountType.ProposalV1])),
          x
        )
      }),
      ...pubkeys.map((x) => {
        return getProposalsFilter(
          programId,
          connection,
          bs58.encode(Uint8Array.from([GovernanceAccountType.ProposalV2])),
          x
        )
      }),
    ]),
  })

  const accounts: ProgramAccount<Proposal>[] = []
  const proposalsData = await proposalsRaw.json()

  const rawAccounts = proposalsData
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      proposalsData.flatMap((x: any) => x.result)
    : []
  for (const rawAccount of rawAccounts) {
    try {
      const getSchema = getGovernanceSchemaForAccount
      const data = Buffer.from(rawAccount.account.data[0], 'base64')
      const accountType = data[0]
      const account: ProgramAccount<Proposal> = {
        pubkey: new PublicKey(rawAccount.pubkey),
        account: deserializeBorsh(getSchema(accountType), Proposal, data),
        owner: new PublicKey(rawAccount.account.owner),
      }

      accounts.push(account)
    } catch (ex) {
      console.info(`Can't deserialize @ ${rawAccount.pubkey}, ${ex}.`)
    }
  }
  const acc: ProgramAccount<Proposal>[][] = []
  const reducedAccounts = accounts.reduce((acc, current) => {
    const exsitingIdx = acc.findIndex((x) =>
      x.find(
        (x) =>
          x.account.governance.toBase58() ===
          current.account.governance.toBase58()
      )
    )
    if (exsitingIdx > -1) {
      acc[exsitingIdx].push(current)
    } else {
      acc.push([current])
    }
    return acc
  }, acc)
  return reducedAccounts
}

const getProposalsFilter = (
  programId: PublicKey,
  connection: ConnectionContext,
  memcmpBytes: string,
  pk: PublicKey
) => {
  return {
    jsonrpc: '2.0',
    id: 1,
    method: 'getProgramAccounts',
    params: [
      programId.toBase58(),
      {
        commitment: connection.current.commitment,
        encoding: 'base64',
        filters: [
          {
            memcmp: {
              offset: 0, // number of bytes
              bytes: memcmpBytes, // base58 encoded string
            },
          },
          {
            memcmp: {
              offset: 1,
              bytes: pk.toBase58(),
            },
          },
        ],
      },
    ],
  }
}
