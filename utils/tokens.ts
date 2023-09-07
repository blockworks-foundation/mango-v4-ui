import { PublicKey, Connection } from '@solana/web3.js'
import { TokenInstructions } from '@project-serum/serum'
import {
  getAssociatedTokenAddress,
  toUiDecimals,
} from '@blockworks-foundation/mango-v4'
import {
  Metaplex,
  Nft,
  Sft,
  SftWithToken,
  NftWithToken,
  Metadata,
  JsonMetadata,
} from '@metaplex-foundation/js'

export class TokenAccount {
  publicKey!: PublicKey
  mint!: PublicKey
  owner!: PublicKey
  amount!: number
  decimals!: number
  uiAmount: number

  constructor(
    publicKey: PublicKey,
    decoded: {
      mint: PublicKey
      owner: PublicKey
      amount: number
      decimals: number
      uiAmount: number
    },
  ) {
    this.publicKey = publicKey
    this.uiAmount = 0
    Object.assign(this, decoded)
  }
}

type RawNft = Nft | Sft | SftWithToken | NftWithToken
type NftWithATA = RawNft & {
  owner: null | PublicKey
  tokenAccountAddress: null | PublicKey
}

function exists<T>(item: T | null | undefined): item is T {
  return !!item
}

export async function getTokenAccountsByOwnerWithWrappedSol(
  connection: Connection,
  owner: PublicKey,
): Promise<TokenAccount[]> {
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

const enhanceNFT = (nft: NftWithATA) => {
  return {
    image: nft.json?.image || '',
    name: nft.json?.name || '',
    address: nft.metadataAddress.toBase58(),
    collectionAddress: nft.collection?.address.toBase58(),
    mint: nft.mint.address.toBase58(),
    tokenAccount: nft.tokenAccountAddress?.toBase58() || '',
    json: nft.json,
  }
}

function loadNft(
  nft: Metadata<JsonMetadata<string>> | Nft | Sft,
  connection: Connection,
) {
  const metaplex = new Metaplex(connection)

  return Promise.race([
    metaplex
      .nfts()
      // @ts-ignore
      .load({ metadata: nft })
      .catch((e) => {
        console.error(e)
        return null
      }),
  ])
}

export async function getNFTsByOwner(owner: PublicKey, connection: Connection) {
  const metaplex = new Metaplex(connection)

  const rawNfts = await metaplex.nfts().findAllByOwner({
    owner,
  })

  const nfts = await Promise.all(
    rawNfts.map((nft) => loadNft(nft, connection)),
  ).then((nfts) =>
    Promise.all(
      nfts.filter(exists).map(async (nft) => ({
        ...nft,
        owner,
        tokenAccountAddress: await getAssociatedTokenAddress(
          nft.mint.address,
          owner,
          true,
        ).catch((e) => {
          console.error(e)
          return null
        }),
      })),
    ),
  )

  return nfts.map(enhanceNFT)
}

export const formatTokenSymbol = (symbol: string) => {
  if (symbol.toLowerCase().includes('portal')) {
    const truncSymbol = symbol.split(' ')[0].toUpperCase()
    return truncSymbol === 'WBTC' ? 'wBTC' : truncSymbol
  }
  return symbol === 'MSOL' ? 'mSOL' : symbol
}
