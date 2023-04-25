import {
  getGovernanceAccounts,
  getRealm,
  Governance,
  ProgramAccount,
  pubkeyFilter,
} from '@solana/spl-governance'
import { Connection, PublicKey } from '@solana/web3.js'
import { TokenProgramAccount } from './accounts/vsrAccounts'
import { MintLayout, RawMint } from '@solana/spl-token'
import BN from 'bn.js'

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
): Promise<TokenProgramAccount<RawMint> | undefined> {
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

export function parseMintAccountData(data: Buffer): RawMint {
  const mintInfo = MintLayout.decode(data)
  return mintInfo
}

export const fmtTokenAmount = (c: BN, decimals?: number) =>
  c?.div(new BN(10).pow(new BN(decimals ?? 0))).toNumber() || 0

export const tryGetPubKey = (pubkey: string) => {
  try {
    return new PublicKey(pubkey)
  } catch (e) {
    return null
  }
}

const urlRegex =
  // eslint-disable-next-line
  /(https:\/\/)(gist\.github.com\/)([\w\/]{1,39}\/)([\w]{1,32})/

export async function fetchGistFile(gistUrl: string) {
  const controller = new AbortController()
  const pieces = gistUrl.match(urlRegex)
  if (pieces) {
    const justIdWithoutUser = pieces[4]
    if (justIdWithoutUser) {
      const apiUrl = 'https://api.github.com/gists/' + justIdWithoutUser
      const apiResponse = await fetch(apiUrl, {
        signal: controller.signal,
      })
      const jsonContent = await apiResponse.json()
      if (apiResponse.status === 200) {
        const nextUrlFileName = Object.keys(jsonContent['files'])[0]
        const nextUrl = jsonContent['files'][nextUrlFileName]['raw_url']
        if (nextUrl.startsWith('https://gist.githubusercontent.com/')) {
          const fileResponse = await fetch(nextUrl, {
            signal: controller.signal,
          })
          const body = await fileResponse.json()
          //console.log('fetchGistFile file', gistUrl, fileResponse)
          return body
        }
        return undefined
      } else {
        console.warn('could not fetchGistFile', {
          gistUrl,
          apiResponse: jsonContent,
        })
      }
    }
  }

  return undefined
}

export async function resolveProposalDescription(descriptionLink: string) {
  try {
    const url = new URL(descriptionLink)
    const desc = (await fetchGistFile(url.toString())) ?? descriptionLink
    return desc
  } catch {
    return descriptionLink
  }
}
