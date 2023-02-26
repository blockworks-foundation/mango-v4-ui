import { AccountInfo, PublicKey, TransactionInstruction } from '@solana/web3.js'

export declare type SideType = typeof Side.Ask | typeof Side.Bid
export declare const Side: {
  Bid: {
    // eslint-disable-next-line @typescript-eslint/ban-types
    bid: {}
  }
  Ask: {
    // eslint-disable-next-line @typescript-eslint/ban-types
    ask: {}
  }
}

export interface QuoteParams {
  sourceMint: string
  destinationMint: string
  amount: number
  swapMode: SwapMode
}
export declare type TokenMintAddress = string
export interface Quote {
  notEnoughLiquidity: boolean
  minInAmount?: number
  minOutAmount?: number
  inAmount: number
  outAmount: number
  feeAmount: number
  feeMint: TokenMintAddress
  feePct: number
  priceImpactPct: number
}
export declare type QuoteMintToReferrer = Map<TokenMintAddress, string>
export interface SwapParams {
  sourceMint: string
  destinationMint: string
  userSourceTokenAccount: string
  userDestinationTokenAccount: string
  userTransferAuthority: string
  /**
   * amount is used for instruction and can be null when it is an intermediate swap, only the first swap has an amount
   */
  amount: number
  swapMode: SwapMode
  openOrdersAddress?: string
  quoteMintToReferrer?: QuoteMintToReferrer
}
export declare type PlatformFee = {
  feeBps: number
  feeAccount: string
}
export interface ExactOutSwapParams extends SwapParams {
  inAmount: number
  slippageBps: number
  platformFee?: PlatformFee
  overflowFeeAccount?: string
}
export declare type AccountInfoMap = Map<string, AccountInfo<Buffer> | null>

export declare type AmmLabel =
  | 'Aldrin'
  | 'Crema'
  | 'Cropper'
  | 'Cykura'
  | 'DeltaFi'
  | 'GooseFX'
  | 'Invariant'
  | 'Lifinity'
  | 'Lifinity V2'
  | 'Marinade'
  | 'Mercurial'
  | 'Meteora'
  | 'Raydium'
  | 'Raydium CLMM'
  | 'Saber'
  | 'Serum'
  | 'Orca'
  | 'Step'
  | 'Penguin'
  | 'Saros'
  | 'Stepn'
  | 'Orca (Whirlpools)'
  | 'Sencha'
  | 'Saber (Decimals)'
  | 'Dradex'
  | 'Balansol'
  | 'Openbook'
  | 'Unknown'

export interface TransactionFeeInfo {
  signatureFee: number
  openOrdersDeposits: number[]
  ataDeposits: number[]
  totalFeeAndDeposits: number
  minimumSOLForTransaction: number
}

export declare enum SwapMode {
  ExactIn = 'ExactIn',
  ExactOut = 'ExactOut',
}

export interface Fee {
  amount: number
  mint: string
  pct: number
}
export interface MarketInfo {
  id: string
  inAmount: number
  inputMint: string
  label: string
  lpFee: Fee
  notEnoughLiquidity: boolean
  outAmount: number
  outputMint: string
  platformFee: Fee
  priceImpactPct: number
}

export interface RouteInfo {
  amount: number
  inAmount: number
  marketInfos: MarketInfo[]
  otherAmountThreshold: number
  outAmount: number
  priceImpactPct: number
  slippageBps: number
  swapMode: SwapMode
  instructions?: TransactionInstruction[]
  mints?: PublicKey[]
  routerName?: 'Mango'
}

export type Routes = {
  routesInfos: RouteInfo[]
  cached: boolean
}

export type Token = {
  address: string
  chainId: number
  decimals: number
  name: string
  symbol: string
  logoURI: string
  extensions: {
    coingeckoId?: string
  }
  tags: string[]
}
