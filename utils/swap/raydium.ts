import {
  LIQUIDITY_STATE_LAYOUT_V4,
  LiquidityPoolKeys,
  Liquidity,
  Token,
  TokenAmount,
  Percent,
  MARKET_STATE_LAYOUT_V3,
  Market,
  CurrencyAmount,
  Price,
} from '@raydium-io/raydium-sdk'
import { TOKEN_PROGRAM_ID } from '@solana/spl-governance'
import { getAssociatedTokenAddressSync } from '@solana/spl-token'
import {
  Connection,
  GetProgramAccountsResponse,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js'
import BN from 'bn.js'

const RAYDIUM_V4_PROGRAM_ID = '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'

const _getProgramAccounts = (
  connection: Connection,
  baseMint: string,
  quoteMint: string,
): Promise<GetProgramAccountsResponse> => {
  const layout = LIQUIDITY_STATE_LAYOUT_V4

  return connection.getProgramAccounts(new PublicKey(RAYDIUM_V4_PROGRAM_ID), {
    filters: [
      { dataSize: layout.span },
      {
        memcmp: {
          offset: layout.offsetOf('baseMint'),
          bytes: new PublicKey(baseMint).toBase58(),
        },
      },
      {
        memcmp: {
          offset: layout.offsetOf('quoteMint'),
          bytes: new PublicKey(quoteMint).toBase58(),
        },
      },
    ],
  })
}

const getProgramAccounts = async (
  connection: Connection,
  baseMint: string,
  quoteMint: string,
) => {
  const response = await Promise.all([
    _getProgramAccounts(connection, baseMint, quoteMint),
    _getProgramAccounts(connection, quoteMint, baseMint),
  ])

  return response.filter((r) => r.length > 0).flatMap((x) => x)
}

export const findRaydiumPoolInfo = async (
  connection: Connection,
  baseMint: string,
  quoteMint: string,
): Promise<LiquidityPoolKeys | undefined> => {
  const layout = LIQUIDITY_STATE_LAYOUT_V4

  const programData = await getProgramAccounts(connection, baseMint, quoteMint)

  const collectedPoolResults = programData
    .map((info) => ({
      id: new PublicKey(info.pubkey),
      version: 4,
      programId: new PublicKey(RAYDIUM_V4_PROGRAM_ID),
      ...layout.decode(info.account.data),
    }))
    .flat()

  const pools = await Promise.all([
    fetch(`https://api.dexscreener.com/latest/dex/search?q=${baseMint}`),
    fetch(`https://api.dexscreener.com/latest/dex/search?q=${quoteMint}`),
  ])
  const resp = await Promise.all([...pools.map((x) => x.json())])

  const bestDexScannerPoolId = resp
    .flatMap((x) => x.pairs)
    .find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (x: any) =>
        x.dexId === 'raydium' &&
        ((x.baseToken.address === baseMint &&
          x.quoteToken.address === quoteMint) ||
          (x.baseToken.address === quoteMint &&
            x.quoteToken.address === baseMint)),
    )?.pairAddress

  const pool = collectedPoolResults.find(
    (x) => x.id.toBase58() === bestDexScannerPoolId,
  )

  if (!pool) return undefined

  const market = await connection
    .getAccountInfo(pool.marketId)
    .then((item) => ({
      programId: item!.owner,
      ...MARKET_STATE_LAYOUT_V3.decode(item!.data),
    }))

  const authority = Liquidity.getAssociatedAuthority({
    programId: new PublicKey(RAYDIUM_V4_PROGRAM_ID),
  }).publicKey

  const marketProgramId = market.programId

  const poolKeys = {
    id: pool.id,
    baseMint: pool.baseMint,
    quoteMint: pool.quoteMint,
    lpMint: pool.lpMint,
    baseDecimals: Number.parseInt(pool.baseDecimal.toString()),
    quoteDecimals: Number.parseInt(pool.quoteDecimal.toString()),
    lpDecimals: Number.parseInt(pool.baseDecimal.toString()),
    version: pool.version,
    programId: pool.programId,
    openOrders: pool.openOrders,
    targetOrders: pool.targetOrders,
    baseVault: pool.baseVault,
    quoteVault: pool.quoteVault,
    marketVersion: 3,
    authority: authority,
    marketProgramId,
    marketId: market.ownAddress,
    marketAuthority: Market.getAssociatedAuthority({
      programId: marketProgramId,
      marketId: market.ownAddress,
    }).publicKey,
    marketBaseVault: market.baseVault,
    marketQuoteVault: market.quoteVault,
    marketBids: market.bids,
    marketAsks: market.asks,
    marketEventQueue: market.eventQueue,
    withdrawQueue: pool.withdrawQueue,
    lpVault: pool.lpVault,
    lookupTableAccount: PublicKey.default,
  } as LiquidityPoolKeys

  return poolKeys
}

const calcAmountOut = async (
  connection: Connection,
  poolKeys: LiquidityPoolKeys,
  rawAmountIn: number,
  slippage = 5,
  swapInDirection: boolean,
) => {
  const poolInfo = await Liquidity.fetchInfo({
    connection: connection,
    poolKeys,
  })

  let currencyInMint = poolKeys.baseMint
  let currencyInDecimals = poolInfo.baseDecimals
  let currencyOutMint = poolKeys.quoteMint
  let currencyOutDecimals = poolInfo.quoteDecimals

  if (!swapInDirection) {
    currencyInMint = poolKeys.quoteMint
    currencyInDecimals = poolInfo.quoteDecimals
    currencyOutMint = poolKeys.baseMint
    currencyOutDecimals = poolInfo.baseDecimals
  }

  const currencyIn = new Token(
    TOKEN_PROGRAM_ID,
    currencyInMint,
    currencyInDecimals,
  )
  const amountIn = new TokenAmount(
    currencyIn,
    rawAmountIn.toFixed(currencyInDecimals),
    false,
  )
  const currencyOut = new Token(
    TOKEN_PROGRAM_ID,
    currencyOutMint,
    currencyOutDecimals,
  )
  const slippageX = new Percent(Math.ceil(slippage * 10), 1000)

  const {
    amountOut,
    minAmountOut,
    currentPrice,
    executionPrice,
    priceImpact,
    fee,
  } = Liquidity.computeAmountOut({
    poolKeys,
    poolInfo,
    amountIn,
    currencyOut,
    slippage: slippageX,
  })

  return {
    amountIn: amountIn,
    amountOut: amountOut,
    inAmount: amountIn.raw.toNumber(),
    outAmount: amountOut.raw.toNumber(),
    otherAmountThreshold: minAmountOut.raw.toNumber(),
    minAmountOut: minAmountOut,
    currentPrice,
    executionPrice,
    priceImpactPct: Number(priceImpact.toSignificant()) / 100,
    fee,
    inputMint: poolKeys.quoteMint.toBase58(),
    outputMint: poolKeys.baseMint.toBase58(),
    routePlan: [
      {
        swapInfo: {
          ammKey: poolKeys.id.toBase58(),
          label: 'Raydium',
          inputMint: poolKeys.quoteMint.toBase58(),
          outputMint: poolKeys.baseMint.toBase58(),
          inAmount: amountIn.raw.toNumber(),
          outAmount: amountOut.raw.toNumber(),
          feeAmount: 0,
          feeMint: poolKeys.lpMint.toBase58(),
        },
        percent: 100,
      },
    ],
  }
}

export const getSwapTransaction = async (
  connection: Connection,
  toToken: string,
  amount: number,
  poolKeys: LiquidityPoolKeys,
  slippage = 5,
  wallet: PublicKey,
  mangoAccountSwap: boolean,
): Promise<{
  bestRoute: {
    amountIn: TokenAmount
    amountOut: TokenAmount | CurrencyAmount
    inAmount: number
    outAmount: number
    otherAmountThreshold: number
    currentPrice: Price
    executionPrice: Price | null
    priceImpactPct: number
    fee: CurrencyAmount
    instructions: TransactionInstruction[]
  }
}> => {
  const directionIn = poolKeys.quoteMint.toString() == toToken

  const bestRoute = await calcAmountOut(
    connection,
    poolKeys,
    amount,
    slippage,
    directionIn,
  )

  const tokenInAta = getAssociatedTokenAddressSync(
    new PublicKey(directionIn ? bestRoute.outputMint : bestRoute.inputMint),
    wallet,
  )
  const tokenOutAta = getAssociatedTokenAddressSync(
    new PublicKey(directionIn ? bestRoute.inputMint : bestRoute.outputMint),
    wallet,
  )
  const swapTransaction = Liquidity.makeSwapInstruction({
    poolKeys: {
      ...poolKeys,
    },
    userKeys: {
      tokenAccountIn: tokenInAta,
      tokenAccountOut: tokenOutAta,
      owner: wallet,
    },
    amountIn: bestRoute.amountIn.raw,
    amountOut: bestRoute.minAmountOut.raw.sub(bestRoute.fee?.raw ?? new BN(0)),
    fixedSide: !directionIn ? 'in' : 'out',
  })

  const instructions =
    swapTransaction.innerTransaction.instructions.filter(Boolean)

  const filtered_instructions = mangoAccountSwap
    ? instructions
        .filter((ix) => !isSetupIx(ix.programId))
        .filter(
          (ix) => !isDuplicateAta(ix, poolKeys.baseMint, poolKeys.quoteMint),
        )
    : instructions

  return { bestRoute: { ...bestRoute, instructions: filtered_instructions } }
}

const isSetupIx = (pk: PublicKey): boolean =>
  pk.toString() === 'ComputeBudget111111111111111111111111111111' ||
  pk.toString() === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'

const isDuplicateAta = (
  ix: TransactionInstruction,
  inputMint: PublicKey,
  outputMint: PublicKey,
): boolean => {
  return (
    ix.programId.toString() ===
      'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL' &&
    (ix.keys[3].pubkey.toString() === inputMint.toString() ||
      ix.keys[3].pubkey.toString() === outputMint.toString())
  )
}
