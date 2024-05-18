import Mango4, {
  Bank,
  BookSide as Mango4BookSide,
  Group,
  MangoClient,
  OpenbookV2Market,
  PerpMarket,
  PerpOrder,
  Serum3Market,
  BookSideType,
} from '@blockworks-foundation/mango-v4'
import { AnchorProvider } from '@coral-xyz/anchor'
import Openbook2, {
  Market as Openbook2Market,
  BookSide as Openbook2BookSide,
  MarketAccount,
  OpenBookV2Client,
  SideUtils,
} from '@openbook-dex/openbook-v2'
import Serum3, { Orderbook as Serum3Orderbook } from '@project-serum/serum'
import { Order as Serum3Order } from '@project-serum/serum/lib/market'
import { Keypair, PublicKey } from '@solana/web3.js'
import { OpenbookOrder } from '@store/mangoStore'
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
  getBanks(group: Group): { base?: Bank; quote: Bank }
  getBookPks(): { bids: PublicKey; asks: PublicKey }
  decodeBook(side: 'bid' | 'ask', data: Buffer): BookSideAdapter
}

export interface BookSideAdapter {
  getL2(depth: number): [number, number][]
  getOpenOrdersPrices(
    openOrders: Record<string, Serum3Order[] | PerpOrder[] | OpenbookOrder[]>,
  ): number[]
  updateOracles(values: number[]): void
}

export function wrapMarketInAdapter(
  client: MangoClient,
  group: Group,
  market: Serum3Market | OpenbookV2Market | PerpMarket,
): MarketAdapter {
  if (market instanceof PerpMarket) {
    return new Mango4PerpMarketAdaper(client, market)
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
    const wrappedMarket = new Openbook2Market(
      openbookClient,
      market.publicKey,
      fullMarket,
    )
    return new Openbook2MarketAdaper(wrappedMarket)
  }

  throw new Error("unknown market type, can't wrap in Adapter")
}

// MarketAdapters

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

  getBanks(group: Group) {
    const base = group.getFirstBankByMint(this.market.baseMintAddress)
    const quote = group.getFirstBankByMint(this.market.quoteMintAddress)
    return { base, quote }
  }

  getBookPks() {
    return { bids: this.market.bidsAddress, asks: this.market.asksAddress }
  }

  decodeBook(_side: 'bid' | 'ask', data: Buffer) {
    return new Serum3BookSideAdaper(this, data)
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

  getBanks(group: Group) {
    const base = group.getFirstBankByMint(this.market.account.baseMint)
    const quote = group.getFirstBankByMint(this.market.account.quoteMint)
    return { base, quote }
  }

  getBookPks() {
    return { bids: this.market.account.bids, asks: this.market.account.asks }
  }

  decodeBook(side: 'bid' | 'ask', data: Buffer): BookSideAdapter {
    return new Openbook2BookSideAdapter(this, side, data)
  }
}

export class Mango4PerpMarketAdaper implements MarketAdapter {
  tickSize: number
  minOrderSize: number
  publicKey: PublicKey

  constructor(
    public client: MangoClient,
    public market: PerpMarket,
  ) {
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

  getBanks(group: Group) {
    const quote = group.getFirstBankByTokenIndex(this.market.settleTokenIndex)
    return { quote }
  }

  getBookPks() {
    return { bids: this.market.bids, asks: this.market.asks }
  }

  decodeBook(side: 'bid' | 'ask', data: Buffer): BookSideAdapter {
    return new Mango4PerpBookSideAdaper(this, side, data)
  }
}

// BookSideAdapters

export class Serum3BookSideAdaper implements BookSideAdapter {
  bookSide: Serum3Orderbook

  constructor(
    public market: Serum3MarketAdapter,
    data: Buffer,
  ) {
    this.bookSide = Serum3Orderbook.decode(market.market, data)
  }

  getL2(depth: number): [number, number][] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.bookSide.getL2(depth) as any
  }

  getOpenOrdersPrices(
    _openOrders: Record<string, Serum3Order[] | PerpOrder[] | OpenbookOrder[]>,
  ) {
    return []
  }

  updateOracles(_values: number[]) {
    return
  }
}

export class Openbook2BookSideAdapter implements BookSideAdapter {
  bookSide: Openbook2.BookSide

  constructor(
    public market: Openbook2MarketAdaper,
    side: 'bid' | 'ask',
    data: Buffer,
  ) {
    const bookAccount = Openbook2BookSide.decodeAccountfromBuffer(data)
    const sideTyped = side === 'bid' ? SideUtils.Bid : SideUtils.Ask
    this.bookSide = new Openbook2BookSide(
      market.market,
      PublicKey.default,
      bookAccount,
      sideTyped,
    )
  }

  getL2(depth: number): [number, number][] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.bookSide.getL2(depth) as any
  }
  getOpenOrdersPrices(
    _openOrders: Record<string, Serum3Order[] | PerpOrder[] | OpenbookOrder[]>,
  ) {
    return []
  }
  updateOracles(_values: number[]) {
    return
  }
}

export class Mango4PerpBookSideAdaper implements BookSideAdapter {
  bookSide: Mango4.BookSide

  constructor(
    public market: Mango4PerpMarketAdaper,
    side: 'bid' | 'ask',
    data: Buffer,
  ) {
    const bookAccount = Mango4BookSide.decodeAccountfromBuffer(data)
    const sideTyped = side === 'bid' ? BookSideType.bids : BookSideType.asks
    this.bookSide = new Mango4BookSide(
      market.client,
      market.market,
      sideTyped,
      bookAccount,
    )
    if (side === 'bid') {
      this.market.market._bids = this.bookSide
    } else {
      this.market.market._asks = this.bookSide
    }
  }

  getL2(depth: number): [number, number][] {
    return this.bookSide.getL2Ui(depth)
  }
  getOpenOrdersPrices(
    _openOrders: Record<string, Serum3Order[] | PerpOrder[] | OpenbookOrder[]>,
  ) {
    return []
  }
  updateOracles(_values: number[]) {
    return
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
