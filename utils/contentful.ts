import {
  createClient,
  Entry,
  EntryFieldTypes,
  EntrySkeletonType,
} from 'contentful'
import { Document as RichTextDocument } from '@contentful/rich-text-types'

interface TypeTokenFields {
  tokenName: EntryFieldTypes.Symbol
  slug: EntryFieldTypes.Symbol
  seoTitle: EntryFieldTypes.Symbol
  seoDescription: EntryFieldTypes.Text
  description?: EntryFieldTypes.RichText
  tags: EntryFieldTypes.Array<
    EntryFieldTypes.Symbol<
      | 'AI'
      | 'Bridged (Portal)'
      | 'DeFi'
      | 'DePIN'
      | 'Derivatives'
      | 'Domains'
      | 'Exchange'
      | 'Gaming'
      | 'Governance'
      | 'Infrastructure'
      | 'Layer 1'
      | 'Liquid Staking'
      | 'Meme'
      | 'Payments'
      | 'Social'
      | 'Stablecoin'
    >
  >
  websiteUrl?: EntryFieldTypes.Symbol
  twitterUrl?: EntryFieldTypes.Symbol
  whitepaper?: EntryFieldTypes.Symbol
  mint: EntryFieldTypes.Symbol
  coingeckoId: EntryFieldTypes.Symbol
  symbol: EntryFieldTypes.Symbol
  spotSymbol: EntryFieldTypes.Symbol
  perpSymbol?: EntryFieldTypes.Symbol
  ethMint?: EntryFieldTypes.Symbol
  erc20TokenDecimals?: EntryFieldTypes.Integer
}

type TypeTokenSkeleton = EntrySkeletonType<TypeTokenFields, 'token'>
type TokenPageEntry = Entry<TypeTokenSkeleton, undefined, string>

export interface TokenPage {
  tokenName: string
  symbol: string
  slug: string
  description: RichTextDocument | undefined
  tags: string[]
  websiteUrl?: string
  twitterUrl?: string
  mint: string
  ethMint: string | undefined
  coingeckoId: string
  seoTitle: string
  seoDescription: string
  perpSymbol: string | undefined
  spotSymbol: string
  lastModified: string
  erc20TokenDecimals: number | undefined
}

function parseContentfulTokenPage(
  tokenPageEntry?: TokenPageEntry,
): TokenPage | null {
  if (!tokenPageEntry) {
    return null
  }

  return {
    tokenName: tokenPageEntry.fields.tokenName,
    symbol: tokenPageEntry.fields.symbol,
    slug: tokenPageEntry.fields.slug,
    description: tokenPageEntry.fields.description || undefined,
    tags: tokenPageEntry.fields.tags || [],
    websiteUrl: tokenPageEntry.fields.websiteUrl || undefined,
    twitterUrl: tokenPageEntry.fields.twitterUrl || undefined,
    mint: tokenPageEntry.fields.mint,
    ethMint: tokenPageEntry.fields.ethMint || undefined,
    coingeckoId: tokenPageEntry.fields.coingeckoId,
    seoTitle: tokenPageEntry.fields.seoTitle,
    seoDescription: tokenPageEntry.fields.seoDescription,
    perpSymbol: tokenPageEntry.fields.perpSymbol || undefined,
    spotSymbol: tokenPageEntry.fields.spotSymbol,
    lastModified: tokenPageEntry.sys.updatedAt,
    erc20TokenDecimals: tokenPageEntry.fields.erc20TokenDecimals || undefined,
  }
}

export async function fetchCMSTokenPage(
  symbol: string | undefined,
): Promise<TokenPage[]> {
  const client = createClient({
    space: process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID!,
    accessToken: process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN!,
  })

  const tokenPagesResult = await client.getEntries({
    content_type: 'token',
    'fields.symbol[in]': symbol,
    include: 2,
    order: ['fields.tokenName'],
  })

  const parsedTokenPages = tokenPagesResult.items.map(
    (tokenPageEntry) =>
      parseContentfulTokenPage(tokenPageEntry as TokenPageEntry) as TokenPage,
  )

  return parsedTokenPages
}
