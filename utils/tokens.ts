import {
  PublicKey,
  Connection,
  RpcResponseAndContext,
  AccountInfo,
} from '@solana/web3.js'
import { TokenInstructions } from '@project-serum/serum'
import {
  Group,
  Serum3Market,
  toUiDecimals,
} from '@blockworks-foundation/mango-v4'
import { Token } from 'types/jupiter'

export class TokenAccount {
  publicKey!: PublicKey
  mint!: PublicKey
  owner!: PublicKey
  amount!: number
  decimals!: number
  uiAmount: number

  constructor(publicKey: PublicKey, decoded: any) {
    this.publicKey = publicKey
    this.uiAmount = 0
    Object.assign(this, decoded)
  }
}

export async function getTokenAccountsByOwnerWithWrappedSol(
  connection: Connection,
  owner: PublicKey
): Promise<any> {
  const solReq = connection.getAccountInfo(owner)
  const tokenReq = connection.getParsedTokenAccountsByOwner(owner, {
    programId: TokenInstructions.TOKEN_PROGRAM_ID,
  })

  // fetch data
  const [solResp, tokenResp] = await Promise.all([solReq, tokenReq])

  // parse token accounts
  const tokenAccounts = tokenResp.value.map((t) => {
    return {
      publicKey: t.pubkey,
      mint: t.account.data.parsed.info.mint,
      owner: t.account.data.parsed.info.owner,
      amount: t.account.data.parsed.info.tokenAmount.amount,
      uiAmount: t.account.data.parsed.info.tokenAmount.uiAmount,
      decimals: t.account.data.parsed.info.tokenAmount.decimals,
    }
  })
  // create fake wrapped sol account to reflect sol balances in user's wallet
  const lamports = solResp?.lamports || 0
  const solAccount = new TokenAccount(owner, {
    mint: TokenInstructions.WRAPPED_SOL_MINT,
    owner,
    amount: lamports,
    uiAmount: toUiDecimals(lamports, 9),
    decimals: 9,
  })

  // prepend SOL account to beginning of list
  return [solAccount].concat(tokenAccounts)
}

export const fetchNftsFromHolaplexIndexer = async (owner: PublicKey) => {
  const result = await fetch('https://graph.holaplex.com/v1', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
        query nfts($owners: [PublicKey!]) {
            nfts(
              owners: $owners,
               limit: 10000, offset: 0) {
              name
              mintAddress
              address
              image
              updateAuthorityAddress
              collection {
                creators {
                  verified
                  address
                }
                mintAddress
              }

            }

        }
      `,
      variables: {
        owners: [owner.toBase58()],
      },
    }),
  })

  const body = await result.json()
  return body.data
}

export const formatTokenSymbol = (symbol: string) =>
  symbol === 'MSOL' ? 'mSOL' : symbol === 'SOETH' ? 'soETH' : symbol
