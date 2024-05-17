import {
  Group,
  MangoClient,
  OpenbookV2Market,
  PerpMarket,
  Serum3Market,
} from '@blockworks-foundation/mango-v4'
import { AnchorProvider } from '@coral-xyz/anchor'
import Openbook2, {
  MarketAccount,
  OpenBookV2Client,
} from '@openbook-dex/openbook-v2'
import Serum3 from '@project-serum/serum'
import { Keypair, PublicKey } from '@solana/web3.js'
import EmptyWallet from 'utils/wallet'

// Define a new interface that extends MarketAccount and adds the tickSize property
export interface ExtendedMarketAccount extends MarketAccount {
  tickSize: number
  minOrderSize: number
  publicKey: PublicKey
}

export interface MarketAdapter {
  tickSize: number
  minOrderSize: number
  publicKey: PublicKey

  isPerpMarket(): boolean
  isSpotMarket(): boolean
}

export function wrapMarketInAdapter(
  client: MangoClient,
  group: Group,
  market: Serum3Market | OpenbookV2Market | PerpMarket,
): MarketAdapter {
  if (market instanceof PerpMarket) {
    return new Mango4PerpMarketAdaper(market)
  }
  if (market instanceof Serum3Market) {
    const fullMarket = group.getSerum3ExternalMarket(market.serumMarketExternal)
    return new Serum3MarketAdapter(fullMarket)
  }
  if (market instanceof OpenbookV2Market) {
    const openbookClient = new OpenBookV2Client(
      new AnchorProvider(
        client.program.provider.connection,
        new EmptyWallet(Keypair.generate()),
        {
          commitment: client.program.provider.connection.commitment,
        },
      ),
    )
    const fullMarket = group.getOpenbookV2ExternalMarket(
      market.openbookMarketExternal,
    )
    const wrappedMarket = new Openbook2.Market(
      openbookClient,
      market.publicKey,
      fullMarket,
    )
    return new Openbook2MarketAdaper(wrappedMarket)
  }

  throw new Error("unknown market type, can't wrap in Adapter")
}

export class Serum3MarketAdapter {
  tickSize: number
  minOrderSize: number
  publicKey: PublicKey

  constructor(public market: Serum3.Market) {
    this.tickSize = market.tickSize
    this.minOrderSize = market.minOrderSize
    this.publicKey = market.publicKey
  }

  isPerpMarket() {
    return false
  }
  isSpotMarket() {
    return true
  }
}

export class Openbook2MarketAdaper {
  tickSize: number
  minOrderSize: number
  publicKey: PublicKey

  constructor(public market: Openbook2.Market) {
    this.tickSize = market.tickSize.toNumber()
    this.minOrderSize = market.minOrderSize.toNumber()
    this.publicKey = market.pubkey
  }

  isPerpMarket() {
    return false
  }
  isSpotMarket() {
    return true
  }
}

export class Mango4PerpMarketAdaper {
  tickSize: number
  minOrderSize: number
  publicKey: PublicKey

  constructor(public market: PerpMarket) {
    this.tickSize = market.tickSize
    this.minOrderSize = market.minOrderSize
    this.publicKey = market.publicKey
  }

  isPerpMarket() {
    return true
  }
  isSpotMarket() {
    return false
  }
}

export function isOpenbookV2ExternalMarket(
  obj: unknown,
): obj is ExtendedMarketAccount {
  return typeof obj === 'object' && obj !== null && 'openOrdersAdmin' in obj
}

export function isOpenbookV2Market(obj: unknown): obj is OpenbookV2Market {
  return (
    typeof obj === 'object' && obj !== null && 'openbookMarketExternal' in obj
  )
}

export function isOpenbookV2OpenOrder(
  obj: unknown,
): obj is Openbook2.OpenOrdersAccount {
  return typeof obj === 'object' && obj !== null && 'delegate' in obj
}
