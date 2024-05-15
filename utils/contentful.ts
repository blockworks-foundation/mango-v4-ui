import {
  Asset,
  AssetLink,
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

function parseContentfulContentImage(
  asset?: Asset<undefined, string> | { sys: AssetLink },
): ContentImage | null {
  if (!asset) {
    return null
  }

  if (!('fields' in asset)) {
    return null
  }

  return {
    src: asset.fields.file?.url || '',
    alt: asset.fields.description || '',
    width: asset.fields.file?.details.image?.width || 0,
    height: asset.fields.file?.details.image?.height || 0,
  }
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

function parseContentfulAppAnnouncement(
  homePageAnnouncementEntry?: AppAnnouncementEntry,
): AppAnnouncement | null {
  if (!homePageAnnouncementEntry) {
    return null
  }

  return {
    title: homePageAnnouncementEntry.fields.title || '',
    description: homePageAnnouncementEntry.fields.description || '',
    linkPath: homePageAnnouncementEntry.fields.linkPath || '',
    image: parseContentfulContentImage(homePageAnnouncementEntry.fields.image),
  }
}

export interface ContentImage {
  src: string
  alt: string
  width: number
  height: number
}

export interface AppAnnouncement {
  title: string
  description?: string
  image: ContentImage | null
  linkPath: string
}

export interface TypeAppAnnouncementFields {
  title: EntryFieldTypes.Symbol
  description?: EntryFieldTypes.Symbol
  linkPath: EntryFieldTypes.Symbol
  image?: EntryFieldTypes.AssetLink
}

export type TypeAppAnnouncementSkeleton = EntrySkeletonType<
  TypeAppAnnouncementFields,
  'appAnnouncement'
>

type AppAnnouncementEntry = Entry<
  TypeAppAnnouncementSkeleton,
  undefined,
  string
>

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

export async function fetchCMSAnnounements(): Promise<AppAnnouncement[]> {
  const client = createClient({
    space: process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID!,
    accessToken: process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN!,
  })

  const announcementsResult =
    await client.getEntries<TypeAppAnnouncementSkeleton>({
      content_type: 'appAnnouncement',
      include: 2,
      order: ['-sys.createdAt'],
      limit: 3,
    })

  return announcementsResult.items.map(
    (appAnnouncementEntry) =>
      parseContentfulAppAnnouncement(appAnnouncementEntry) as AppAnnouncement,
  )
}
