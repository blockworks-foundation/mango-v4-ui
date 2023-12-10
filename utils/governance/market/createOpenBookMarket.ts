import { MARKET_STATE_LAYOUT_V2 } from '@project-serum/serum'
import { INSTRUCTION_LAYOUT } from '@project-serum/serum/lib/instructions'
import {
  createInitializeAccountInstruction,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token'
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js'
import BN from 'bn.js'

const ZERO = new BN(0)

export const makeCreateOpenBookMarketInstructionSimple = async ({
  connection,
  wallet,
  baseInfo,
  quoteInfo,
  lotSize, // 1
  tickSize, // 0.01
  dexProgramId,
  xlSize,
}: {
  connection: Connection
  wallet: PublicKey
  baseInfo: {
    mint: PublicKey
    decimals: number
  }
  quoteInfo: {
    mint: PublicKey
    decimals: number
  }
  lotSize: number
  tickSize: number
  dexProgramId: PublicKey
  xlSize?: boolean
}) => {
  const market = Keypair.generate()
  const requestQueue = Keypair.generate()
  const eventQueue = Keypair.generate()
  const bids = Keypair.generate()
  const asks = Keypair.generate()
  const baseVault = Keypair.generate()
  const quoteVault = Keypair.generate()
  const feeRateBps = 0
  const quoteDustThreshold = new BN(100)
  const eventQueSize = !xlSize ? 45100 : 1048564

  function getVaultOwnerAndNonce() {
    const vaultSignerNonce = new BN(0)
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const vaultOwner = PublicKey.createProgramAddressSync(
          [
            market.publicKey.toBuffer(),
            vaultSignerNonce.toArrayLike(Buffer, 'le', 8),
          ],
          dexProgramId,
        )
        return { vaultOwner, vaultSignerNonce }
      } catch (e) {
        vaultSignerNonce.iaddn(1)
        if (vaultSignerNonce.gt(new BN(25555)))
          throw Error('find vault owner error')
      }
    }
  }
  const { vaultOwner, vaultSignerNonce } = getVaultOwnerAndNonce()

  const baseLotSize = new BN(Math.round(10 ** baseInfo.decimals * lotSize))
  const quoteLotSize = new BN(
    Math.round(lotSize * 10 ** quoteInfo.decimals * tickSize),
  )

  if (baseLotSize.eq(ZERO)) throw Error('lot size is too small')
  if (quoteLotSize.eq(ZERO)) throw Error('tick size or lot size is too small')

  return await makeCreateMarketInstruction({
    connection,
    wallet,
    marketInfo: {
      programId: dexProgramId,
      id: market,
      baseMint: baseInfo.mint,
      quoteMint: quoteInfo.mint,
      baseVault,
      quoteVault,
      vaultOwner,
      requestQueue,
      eventQueue,
      bids,
      asks,

      feeRateBps,
      quoteDustThreshold,
      vaultSignerNonce,
      baseLotSize,
      quoteLotSize,
      eventQueSize,
    },
  })
}

const makeCreateMarketInstruction = async ({
  connection,
  wallet,
  marketInfo,
}: {
  connection: Connection
  wallet: PublicKey
  marketInfo: {
    programId: PublicKey
    id: Keypair
    baseMint: PublicKey
    quoteMint: PublicKey
    baseVault: Keypair
    quoteVault: Keypair
    vaultOwner: PublicKey

    requestQueue: Keypair
    eventQueue: Keypair
    bids: Keypair
    asks: Keypair

    feeRateBps: number
    vaultSignerNonce: BN
    quoteDustThreshold: BN

    baseLotSize: BN
    quoteLotSize: BN
    eventQueSize: number
  }
}) => {
  const ins1: TransactionInstruction[] = []
  const accountLamports =
    await connection.getMinimumBalanceForRentExemption(165)
  ins1.push(
    SystemProgram.createAccount({
      fromPubkey: wallet,
      newAccountPubkey: marketInfo.baseVault.publicKey,
      lamports: accountLamports,
      space: 165,
      programId: TOKEN_PROGRAM_ID,
    }),
    SystemProgram.createAccount({
      fromPubkey: wallet,
      newAccountPubkey: marketInfo.quoteVault.publicKey,
      lamports: accountLamports,
      space: 165,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeAccountInstruction(
      marketInfo.baseVault.publicKey,
      marketInfo.baseMint,
      marketInfo.vaultOwner,
    ),
    createInitializeAccountInstruction(
      marketInfo.quoteVault.publicKey,
      marketInfo.quoteMint,
      marketInfo.vaultOwner,
    ),
  )

  const ins2: TransactionInstruction[] = []
  ins2.push(
    SystemProgram.createAccount({
      fromPubkey: wallet,
      newAccountPubkey: marketInfo.id.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(
        MARKET_STATE_LAYOUT_V2.span,
      ),
      space: MARKET_STATE_LAYOUT_V2.span,
      programId: marketInfo.programId,
    }),
    SystemProgram.createAccount({
      fromPubkey: wallet,
      newAccountPubkey: marketInfo.requestQueue.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(124),
      space: 124,
      programId: marketInfo.programId,
    }),
    SystemProgram.createAccount({
      fromPubkey: wallet,
      newAccountPubkey: marketInfo.eventQueue.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(
        marketInfo.eventQueSize,
      ),
      space: marketInfo.eventQueSize,
      programId: marketInfo.programId,
    }),
    SystemProgram.createAccount({
      fromPubkey: wallet,
      newAccountPubkey: marketInfo.bids.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(18484),
      space: 18484,
      programId: marketInfo.programId,
    }),
    SystemProgram.createAccount({
      fromPubkey: wallet,
      newAccountPubkey: marketInfo.asks.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(18484),
      space: 18484,
      programId: marketInfo.programId,
    }),
    initializeMarketInstruction({
      programId: marketInfo.programId,
      marketInfo: {
        id: marketInfo.id.publicKey,
        requestQueue: marketInfo.requestQueue.publicKey,
        eventQueue: marketInfo.eventQueue.publicKey,
        bids: marketInfo.bids.publicKey,
        asks: marketInfo.asks.publicKey,
        baseVault: marketInfo.baseVault.publicKey,
        quoteVault: marketInfo.quoteVault.publicKey,
        baseMint: marketInfo.baseMint,
        quoteMint: marketInfo.quoteMint,

        baseLotSize: marketInfo.baseLotSize,
        quoteLotSize: marketInfo.quoteLotSize,
        feeRateBps: marketInfo.feeRateBps,
        vaultSignerNonce: marketInfo.vaultSignerNonce,
        quoteDustThreshold: marketInfo.quoteDustThreshold,
      },
    }),
  )

  return {
    address: {
      marketId: marketInfo.id.publicKey,
      requestQueue: marketInfo.requestQueue.publicKey,
      eventQueue: marketInfo.eventQueue.publicKey,
      bids: marketInfo.bids.publicKey,
      asks: marketInfo.asks.publicKey,
      baseVault: marketInfo.baseVault.publicKey,
      quoteVault: marketInfo.quoteVault.publicKey,
      baseMint: marketInfo.baseMint,
      quoteMint: marketInfo.quoteMint,
    },
    innerTransactions: [
      {
        instructions: ins1,
        signers: [marketInfo.baseVault, marketInfo.quoteVault],
      },
      {
        instructions: ins2,
        signers: [
          marketInfo.id,
          marketInfo.requestQueue,
          marketInfo.eventQueue,
          marketInfo.bids,
          marketInfo.asks,
        ],
      },
    ],
  }
}

const initializeMarketInstruction = ({
  programId,
  marketInfo,
}: {
  programId: PublicKey
  marketInfo: {
    id: PublicKey
    requestQueue: PublicKey
    eventQueue: PublicKey
    bids: PublicKey
    asks: PublicKey
    baseVault: PublicKey
    quoteVault: PublicKey
    baseMint: PublicKey
    quoteMint: PublicKey
    authority?: PublicKey
    pruneAuthority?: PublicKey

    baseLotSize: BN
    quoteLotSize: BN
    feeRateBps: number
    vaultSignerNonce: BN
    quoteDustThreshold: BN
  }
}) => {
  const keys = [
    { pubkey: marketInfo.id, isSigner: false, isWritable: true },
    { pubkey: marketInfo.requestQueue, isSigner: false, isWritable: true },
    { pubkey: marketInfo.eventQueue, isSigner: false, isWritable: true },
    { pubkey: marketInfo.bids, isSigner: false, isWritable: true },
    { pubkey: marketInfo.asks, isSigner: false, isWritable: true },
    { pubkey: marketInfo.baseVault, isSigner: false, isWritable: true },
    { pubkey: marketInfo.quoteVault, isSigner: false, isWritable: true },
    { pubkey: marketInfo.baseMint, isSigner: false, isWritable: false },
    { pubkey: marketInfo.quoteMint, isSigner: false, isWritable: false },
    // Use a dummy address if using the new dex upgrade to save tx space.
    {
      pubkey: marketInfo.authority ? marketInfo.quoteMint : SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
  ]
    .concat(
      marketInfo.authority
        ? { pubkey: marketInfo.authority, isSigner: false, isWritable: false }
        : [],
    )
    .concat(
      marketInfo.authority && marketInfo.pruneAuthority
        ? {
            pubkey: marketInfo.pruneAuthority,
            isSigner: false,
            isWritable: false,
          }
        : [],
    )

  const data = encodeInstruction({
    initializeMarket: {
      version: 0,
      instruction: 0,
      baseLotSize: marketInfo.baseLotSize,
      quoteLotSize: marketInfo.quoteLotSize,
      feeRateBps: marketInfo.feeRateBps,
      vaultSignerNonce: marketInfo.vaultSignerNonce,
      quoteDustThreshold: marketInfo.quoteDustThreshold,
    },
  })

  return new TransactionInstruction({
    keys,
    programId,
    data,
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function encodeInstruction(instruction: any, maxLength = 100) {
  const b = Buffer.alloc(maxLength)
  return b.slice(0, INSTRUCTION_LAYOUT.encode(instruction, b))
}
