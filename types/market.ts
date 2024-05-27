import Mango4, {
  Bank,
  BookSide as Mango4BookSide,
  Group,
  MangoClient,
  OpenbookV2Market,
  PerpMarket,
  Serum3Market,
  BookSideType,
  Serum3SelfTradeBehavior,
  PerpOrderSide,
  MangoAccount,
  Serum3Side,
  OpenbookV2Side,
  Serum3OrderType,
  PerpOrderType,
} from '@blockworks-foundation/mango-v4'
// import OpenOrders from '@components/trade/OpenOrders'
import { AnchorProvider } from '@coral-xyz/anchor'
import Openbook2, {
  Market as Openbook2Market,
  BookSide as Openbook2BookSide,
  MarketAccount,
  OpenBookV2Client,
  SideUtils,
} from '@openbook-dex/openbook-v2'
import Serum3, { Orderbook as Serum3Orderbook } from '@project-serum/serum'
// import { OpenOrders as Serum3OpenOrders, Order as Serum3Order } from '@project-serum/serum/lib/market'
import { Keypair, PublicKey } from '@solana/web3.js'
import { OrderbookL2 } from 'types'
import { MAX_PERP_SLIPPAGE } from 'utils/constants'
// import { OpenbookOrder } from '@store/mangoStore'
import EmptyWallet from 'utils/wallet'
import mangoStore from '@store/mangoStore'
import { notify } from 'utils/notifications'

// Define a new interface that extends MarketAccount and adds the tickSize property
export interface ExtendedMarketAccount extends MarketAccount {
  tickSize: number
  minOrderSize: number
  publicKey: PublicKey
}

type Side = 'bid' | 'ask'
type OrderType = 'immediateOrCancel' | 'postOnly' | 'limit'

export interface MarketAdapter {
  tickSize: number
  minOrderSize: number
  publicKey: PublicKey

  isPerpMarket(): boolean
  isSpotMarket(): boolean
  getBanks(group: Group): { base?: Bank; quote: Bank }
  getBookPks(): { bids: PublicKey; asks: PublicKey; events: PublicKey }
  decodeBook(side: Side, data: Buffer): BookSideAdapter
  placeOrder(
    group: Group,
    mangoAccount: MangoAccount,
    client: MangoClient,
    orderType: OrderType,
    side: 'buy' | 'sell',
    price: number,
    baseSize: number,
    reduceOnly: boolean,
  ): Promise<string>
  reloadOpenOrders(
    storeGetState: ReturnType<typeof mangoStore.getState>,
    refetchMangoAccount: boolean,
    poolingFunction?: (
      successCallback: () => void,
      timeoutCallback?: (() => void) | undefined,
    ) => Promise<'ready' | 'timeout'>,
  ): Promise<void>
  // decodeEvents(data: Buffer): EventsAdapter
  // decodeOpenOrders(data: Buffer): OpenOrdersAdapter
}

export interface BookSideAdapter {
  getL2(depth: number): [number, number][]
  // getOpenOrders(orderIds: BN[]): Order[]
  // updateOracles(values: number[]): void
}

/* future use
export interface Order {
  orderId: BN
  price: number
  size: number
  side: Side
}

export interface EventsAdapter {
  getUnprocessedFills(ids: BN[]): Fill[]
}

export interface Fill {
  orderId: BN
  baseDelta: number
  quoteDelta: number
}

export interface OpenOrdersAdapter {
  lockedBalance: {[mintPk: string]: number}
  unsettledBalance: {[mintPk: string]: number}
}
*/

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
    return {
      bids: this.market.bidsAddress,
      asks: this.market.asksAddress,
      events: this.market.decoded.eventQueue,
    }
  }

  decodeBook(_side: Side, data: Buffer) {
    return new Serum3BookSideAdaper(this, data)
  }
  async placeOrder(
    group: Group,
    mangoAccount: MangoAccount,
    client: MangoClient,
    orderType: OrderType,
    side: 'buy' | 'sell',
    price: number,
    baseSize: number,
  ) {
    const { signature: tx } = await client.serum3PlaceOrder(
      group,
      mangoAccount,
      this.publicKey,
      side === 'buy' ? Serum3Side.bid : Serum3Side.ask,
      price,
      baseSize,
      Serum3SelfTradeBehavior.decrementTake,
      Serum3OrderType[orderType],
      Date.now(),
      10,
    )
    return tx
  }
  async reloadOpenOrders(
    storeGetState: ReturnType<typeof mangoStore.getState>,
    refetchMangoAccount: boolean,
  ) {
    storeGetState.actions.fetchOpenOrders(refetchMangoAccount)
  }
}

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
}

// openbook2

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
    return {
      bids: this.market.account.bids,
      asks: this.market.account.asks,
      events: this.market.account.eventHeap,
    }
  }

  decodeBook(side: Side, data: Buffer): BookSideAdapter {
    return new Openbook2BookSideAdapter(this, side, data)
  }
  async placeOrder(
    group: Group,
    mangoAccount: MangoAccount,
    client: MangoClient,
    orderType: OrderType,
    side: 'buy' | 'sell',
    price: number,
    baseSize: number,
  ) {
    if (mangoAccount.openbookV2.length === 0) {
      await client.accountExpandV3(
        group,
        mangoAccount,
        mangoAccount.tokens.length,
        mangoAccount.serum3.length,
        mangoAccount.perps.length,
        mangoAccount.perpOpenOrders.length,
        mangoAccount.tokenConditionalSwaps.length,
        1,
      )
    }
    const { signature: tx } = await client.openbookV2PlaceOrder(
      group,
      mangoAccount,
      this.publicKey,
      side === 'buy' ? OpenbookV2Side.bid : OpenbookV2Side.ask,
      price,
      baseSize,
      Serum3SelfTradeBehavior.decrementTake,
      Serum3OrderType[orderType],
      Date.now(),
      10,
    )
    return tx
  }
  async reloadOpenOrders(
    storeGetState: ReturnType<typeof mangoStore.getState>,
    refetchMangoAccount: boolean,
  ) {
    storeGetState.actions.fetchOpenOrders(refetchMangoAccount)
  }
}

export class Openbook2BookSideAdapter implements BookSideAdapter {
  bookSide: Openbook2.BookSide

  constructor(
    public market: Openbook2MarketAdaper,
    side: Side,
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
}

// mango4perp

export class Mango4PerpMarketAdaper implements MarketAdapter {
  tickSize: number
  minOrderSize: number
  publicKey: PublicKey
  perpMarketIndex: number
  reduceOnly: boolean
  oracleUiPrice: number

  constructor(
    public client: MangoClient,
    public market: PerpMarket,
  ) {
    this.tickSize = market.tickSize
    this.minOrderSize = market.minOrderSize
    this.publicKey = market.publicKey
    this.perpMarketIndex = market.perpMarketIndex
    this.reduceOnly = market.reduceOnly
    this.oracleUiPrice = market.uiPrice
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
    return {
      bids: this.market.bids,
      asks: this.market.asks,
      events: this.market.eventQueue,
    }
  }

  decodeBook(side: Side, data: Buffer): BookSideAdapter {
    return new Mango4PerpBookSideAdaper(this, side, data)
  }
  async placeOrder(
    group: Group,
    mangoAccount: MangoAccount,
    client: MangoClient,
    orderType: OrderType,
    side: 'buy' | 'sell',
    price: number,
    baseSize: number,
    reduceOnly: boolean,
  ) {
    const [asks, bids] = await Promise.all([
      this.market.loadAsks(client),
      this.market.loadBids(client),
    ])
    const orderPrice = calcPerpOrderPrice(
      price,
      {
        //is this right ?
        asks: asks.getL2Ui(300),
        bids: bids.getL2Ui(300),
      },
      side,
      true,
      this.oracleUiPrice,
    )

    const { signature: tx } = await client.perpPlaceOrder(
      group,
      mangoAccount,
      this.perpMarketIndex,
      side === 'buy' ? PerpOrderSide.bid : PerpOrderSide.ask,
      orderPrice,
      Math.abs(baseSize),
      undefined, // maxQuoteQuantity
      Date.now(),
      PerpOrderType[orderType],
      this.reduceOnly || reduceOnly,
      undefined,
      undefined,
    )
    return tx
  }
  async reloadOpenOrders(
    storeGetState: ReturnType<typeof mangoStore.getState>,
    refetchMangoAccount: boolean,
    poolingFunction?: (
      successCallback: () => void,
      timeoutCallback?: (() => void) | undefined,
    ) => Promise<'ready' | 'timeout'>,
  ) {
    if (poolingFunction) {
      await poolingFunction(
        () => {
          storeGetState.actions.fetchOpenOrders(refetchMangoAccount)
        },
        () => {
          notify({
            type: 'error',
            title: 'Timeout during perp refresh, please refresh data manually',
          })
        },
      )
    }
  }
}

export class Mango4PerpBookSideAdaper implements BookSideAdapter {
  bookSide: Mango4.BookSide

  constructor(
    public market: Mango4PerpMarketAdaper,
    side: Side,
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
    // this is a side-effect that was present in the previous code
    // should not be required, but safer to leave in until proper testing
    if (side === 'bid') {
      this.market.market._bids = this.bookSide
    } else {
      this.market.market._asks = this.bookSide
    }
  }

  getL2(depth: number): [number, number][] {
    return this.bookSide.getL2Ui(depth)
  }
}

const calcPerpOrderPrice = (
  price: number,
  orderbook: OrderbookL2,
  side: 'buy' | 'sell',
  isMarketOrder: boolean,
  oraclePrice: number,
) => {
  let orderPrice = price
  if (isMarketOrder) {
    try {
      if (side === 'sell') {
        const marketPrice = Math.max(
          oraclePrice,
          orderbook?.bids?.[0]?.[0] || 0,
        )
        orderPrice = marketPrice * (1 - MAX_PERP_SLIPPAGE)
      } else {
        const marketPrice = Math.min(
          oraclePrice,
          orderbook?.asks?.[0]?.[0] || Infinity,
        )
        orderPrice = marketPrice * (1 + MAX_PERP_SLIPPAGE)
      }
    } catch (e) {
      //simple fallback if something go wrong
      const maxSlippage = 0.025
      orderPrice = price * (side === 'buy' ? 1 + maxSlippage : 1 - maxSlippage)
    }
  }
  return orderPrice
}
