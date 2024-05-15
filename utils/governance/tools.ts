import {
  getGovernanceAccounts,
  getRealm,
  Governance,
  ProgramAccount,
  pubkeyFilter,
} from '@solana/spl-governance'
import {
  Connection,
  PublicKey,
  RpcResponseAndContext,
  SignatureResult,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js'
import { TokenProgramAccount } from './accounts/vsrAccounts'
import { MintLayout, RawMint } from '@solana/spl-token'
import { BN } from '@coral-xyz/anchor'
import { awaitTransactionSignatureConfirmation } from '@blockworks-foundation/mangolana/lib/transactions'
import { MangoError, tryStringify } from '@blockworks-foundation/mango-v4'

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
    [pubkeyFilter(1, realmId)!],
  )
  const governancesMap = accountsToPubkeyMap(governances)
  return governancesMap
}

export function accountsToPubkeyMap<T>(accounts: ProgramAccount<T>[]) {
  return arrayToRecord(accounts, (a) => a.pubkey.toBase58())
}

export function arrayToRecord<T>(
  source: readonly T[],
  getKey: (item: T) => string,
) {
  return source.reduce((all, a) => ({ ...all, [getKey(a)]: a }), {}) as Record<
    string,
    T
  >
}

export async function tryGetMint(
  connection: Connection,
  publicKey: PublicKey,
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
      ex,
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

export const compareObjectsAndGetDifferentKeys = <T extends object>(
  object1: T,
  object2: T,
): (keyof T)[] => {
  const diffKeys: string[] = []
  Object.keys(object1).forEach((key) => {
    if (
      object1[key as keyof typeof object1] !==
      object2[key as keyof typeof object2]
    ) {
      diffKeys.push(key)
    }
  })

  return diffKeys as (keyof T)[]
}

export const sendTxAndConfirm = async (
  multipleConnections: Connection[] = [],
  connection: Connection,
  tx: Transaction | VersionedTransaction,
  latestBlockhash: {
    lastValidBlockHeight: number
    blockhash: string
  },
) => {
  let signature = ''
  const abortController = new AbortController()
  try {
    const allConnections = [connection, ...multipleConnections]
    const rawTransaction = tx.serialize()
    signature = await Promise.any(
      allConnections.map((c) => {
        return c.sendRawTransaction(rawTransaction, {
          skipPreflight: true,
        })
      }),
    )
    await Promise.any(
      allConnections.map((c) =>
        awaitTransactionSignatureConfirmation({
          txid: signature,
          confirmLevel: 'processed',
          connection: c,
          timeoutStrategy: {
            block: latestBlockhash,
          },
          abortSignal: abortController.signal,
        }),
      ),
    )
    abortController.abort()
    return signature
  } catch (e) {
    abortController.abort()
    if (e instanceof AggregateError) {
      for (const individualError of e.errors) {
        const stringifiedError = tryStringify(individualError)
        throw new MangoError({
          txid: signature,
          message: `${
            stringifiedError
              ? stringifiedError
              : individualError
              ? individualError
              : 'Unknown error'
          }`,
        })
      }
    }
    if (isErrorWithSignatureResult(e)) {
      const stringifiedError = tryStringify(e?.value?.err)
      throw new MangoError({
        txid: signature,
        message: `${stringifiedError ? stringifiedError : e?.value?.err}`,
      })
    }
    const stringifiedError = tryStringify(e)
    throw new MangoError({
      txid: signature,
      message: `${stringifiedError ? stringifiedError : e}`,
    })
  }
}

function isErrorWithSignatureResult(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  err: any,
): err is RpcResponseAndContext<SignatureResult> {
  return err && typeof err.value !== 'undefined'
}
