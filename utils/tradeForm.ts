import mangoStore from '@store/mangoStore'
import { OrderbookL2, isMangoError } from 'types'
import { notify } from './notifications'
import * as sentry from '@sentry/nextjs'
import {
  Bank,
  MangoAccount,
  Serum3OrderType,
  Serum3SelfTradeBehavior,
  Serum3Side,
  getAssociatedTokenAddress,
  toNative,
} from '@blockworks-foundation/mango-v4'
import {
  AccountMeta,
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js'
import {
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
  createCloseAccountInstruction,
  createInitializeAccount3Instruction,
} from '@solana/spl-token'
import { BN } from '@project-serum/anchor'

export const calculateLimitPriceForMarketOrder = (
  orderBook: OrderbookL2,
  size: number,
  side: 'buy' | 'sell',
): number => {
  const orders = side === 'buy' ? orderBook.asks : orderBook.bids
  let acc = 0
  let selectedOrder
  const orderSize = size
  for (const order of orders) {
    acc += order[1]
    if (acc >= orderSize) {
      selectedOrder = order
      break
    }
  }

  if (!selectedOrder) {
    throw new Error(
      'Unable to place market order for this order size. Please retry.',
    )
  }

  if (side === 'buy') {
    return selectedOrder[0] * 1.05
  } else {
    return selectedOrder[0] * 0.95
  }
}

export const calculateEstPriceForBaseSize = (
  orderBook: OrderbookL2,
  size: number,
  side: 'buy' | 'sell',
): number => {
  const orders = side === 'buy' ? orderBook.asks : orderBook.bids
  let acc = 0
  let selectedOrder
  const orderSize = size
  for (const order of orders) {
    acc += order[1]
    if (acc >= orderSize) {
      selectedOrder = order
      break
    }
  }

  if (!selectedOrder) {
    throw new Error('Unable to calculate market order. Please retry.')
  }

  if (side === 'buy') {
    return selectedOrder[0]
  } else {
    return selectedOrder[0]
  }
}

export const calculateSlippage = (
  orderBook: OrderbookL2,
  size: number,
  side: 'buy' | 'sell',
  markPrice: number,
): number => {
  const bb = orderBook?.bids?.length > 0 && Number(orderBook.bids[0][0])
  const ba = orderBook?.asks?.length > 0 && Number(orderBook.asks[0][0])
  const referencePrice = bb && ba ? (bb + ba) / 2 : markPrice

  if (Number(size)) {
    const estimatedPrice = calculateEstPriceForBaseSize(
      orderBook,
      Number(size),
      side,
    )

    const slippageAbs =
      Number(size) > 0 ? Math.abs(estimatedPrice - referencePrice) : 0

    const slippageRel = (slippageAbs / referencePrice) * 100
    return slippageRel
  }
  return 0
}

export const handlePlaceTriggerOrder = async (
  positionBank: Bank | undefined,
  quoteBank: Bank | undefined,
  amountIn: number,
  triggerPrice: string,
  orderType: TriggerOrderTypes,
  isReducingShort: boolean,
  flipPrices: boolean,
  setSubmitting: (s: boolean) => void,
) => {
  try {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const actions = mangoStore.getState().actions
    const mangoAccount = mangoStore.getState().mangoAccount.current
    // const inputBank = mangoStore.getState().swap.inputBank
    // const outputBank = mangoStore.getState().swap.outputBank

    if (!mangoAccount || !group || !positionBank || !quoteBank || !triggerPrice)
      return
    setSubmitting(true)

    // const amountIn = amountInAsDecimal.toNumber()

    const isReduceLong = !isReducingShort

    try {
      let tx
      if (orderType === TriggerOrderTypes.STOP_LOSS) {
        if (isReduceLong) {
          tx = await client.tcsStopLossOnDeposit(
            group,
            mangoAccount,
            positionBank,
            quoteBank,
            parseFloat(triggerPrice),
            flipPrices,
            amountIn,
            null,
            null,
          )
        } else {
          tx = await client.tcsStopLossOnBorrow(
            group,
            mangoAccount,
            quoteBank,
            positionBank,
            parseFloat(triggerPrice),
            !flipPrices,
            amountIn,
            null,
            true,
            null,
          )
        }
      }
      if (orderType === TriggerOrderTypes.TAKE_PROFIT) {
        if (isReduceLong) {
          tx = await client.tcsTakeProfitOnDeposit(
            group,
            mangoAccount,
            positionBank,
            quoteBank,
            parseFloat(triggerPrice),
            flipPrices,
            amountIn,
            null,
            null,
          )
        } else {
          tx = await client.tcsTakeProfitOnBorrow(
            group,
            mangoAccount,
            quoteBank,
            positionBank,
            parseFloat(triggerPrice),
            !flipPrices,
            amountIn,
            null,
            true,
            null,
          )
        }
      }
      notify({
        title: 'Transaction confirmed',
        type: 'success',
        txid: tx?.signature,
        noSound: true,
      })
      actions.fetchGroup()
      await actions.reloadMangoAccount(tx?.slot)
    } catch (e) {
      console.error('onSwap error: ', e)
      sentry.captureException(e)
      if (isMangoError(e)) {
        notify({
          title: 'Transaction failed',
          description: e.message,
          txid: e?.txid,
          type: 'error',
        })
      }
    }
  } catch (e) {
    console.error('Swap error:', e)
  } finally {
    setSubmitting(false)
  }
}

const createDepositIxs = async (
  mangoAccount: MangoAccount | undefined,
  mintPk: PublicKey,
  amount: number,
) => {
  const group = mangoStore.getState().group
  const client = mangoStore.getState().client
  if (!group || !mangoAccount) return
  const bank = group.getFirstBankByMint(mintPk)

  const tokenAccountPk = await getAssociatedTokenAddress(
    mintPk,
    mangoAccount.owner,
  )

  let wrappedSolAccount: PublicKey | undefined
  let preInstructions: TransactionInstruction[] = []
  let postInstructions: TransactionInstruction[] = []

  const nativeAmount = toNative(amount, group.getMintDecimals(mintPk))

  if (mintPk.equals(NATIVE_MINT)) {
    // Generate a random seed for wrappedSolAccount.
    const seed = Keypair.generate().publicKey.toBase58().slice(0, 32)
    // Calculate a publicKey that will be controlled by the `mangoAccount.owner`.
    wrappedSolAccount = await PublicKey.createWithSeed(
      mangoAccount.owner,
      seed,
      TOKEN_PROGRAM_ID,
    )

    const lamports = nativeAmount.add(new BN(1e7))

    preInstructions = [
      SystemProgram.createAccountWithSeed({
        fromPubkey: mangoAccount.owner,
        basePubkey: mangoAccount.owner,
        seed,
        newAccountPubkey: wrappedSolAccount,
        lamports: lamports.toNumber(),
        space: 165,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeAccount3Instruction(
        wrappedSolAccount,
        NATIVE_MINT,
        mangoAccount.owner,
      ),
    ]
    postInstructions = [
      createCloseAccountInstruction(
        wrappedSolAccount,
        mangoAccount.owner,
        mangoAccount.owner,
      ),
    ]
  }

  const healthRemainingAccounts: PublicKey[] =
    client.buildHealthRemainingAccounts(group, [mangoAccount], [bank], [])

  const depositIx = await client.program.methods
    .tokenDeposit(new BN(nativeAmount), false)
    .accounts({
      group: group.publicKey,
      account: mangoAccount.publicKey,
      owner: mangoAccount.owner,
      bank: bank.publicKey,
      vault: bank.vault,
      oracle: bank.oracle,
      tokenAccount: wrappedSolAccount ?? tokenAccountPk,
      tokenAuthority: mangoAccount.owner,
    })
    .remainingAccounts(
      healthRemainingAccounts.map(
        (pk) =>
          ({ pubkey: pk, isWritable: false, isSigner: false }) as AccountMeta,
      ),
    )
    .instruction()

  return [...preInstructions, depositIx, ...postInstructions]
}

const createSerum3PlaceOrderIxs = async (
  mangoAccount: MangoAccount | undefined,
  externalMarketPk: PublicKey,
  side: Serum3Side,
  price: number,
  size: number,
  selfTradeBehavior: Serum3SelfTradeBehavior,
  orderType: Serum3OrderType,
  clientOrderId: number,
  limit: number,
) => {
  const group = mangoStore.getState().group
  const client = mangoStore.getState().client
  if (!group || !mangoAccount) return
  const placeOrderIxs = await client.serum3PlaceOrderIx(
    group,
    mangoAccount,
    externalMarketPk,
    side,
    price,
    size,
    selfTradeBehavior,
    orderType,
    clientOrderId,
    limit,
  )

  const settleIx = await client.serum3SettleFundsIx(
    group,
    mangoAccount,
    externalMarketPk,
  )

  return [...placeOrderIxs, settleIx]
}

export const depositAndPlaceSerum3Order = async (
  mangoAccount: MangoAccount | undefined,
  depositMintPk: PublicKey,
  amount: number,
  externalMarketPk: PublicKey,
  side: Serum3Side,
  price: number,
  selfTradeBehavior: Serum3SelfTradeBehavior,
  orderType: Serum3OrderType,
  clientOrderId: number,
  limit: number,
) => {
  const group = mangoStore.getState().group
  const client = mangoStore.getState().client
  if (!group) return
  try {
    const depositIxs = await createDepositIxs(
      mangoAccount,
      depositMintPk,
      amount,
    )
    const placeOrderIxs = await createSerum3PlaceOrderIxs(
      mangoAccount,
      externalMarketPk,
      side,
      price,
      amount,
      selfTradeBehavior,
      orderType,
      clientOrderId,
      limit,
    )
    if (depositIxs?.length && placeOrderIxs?.length) {
      const ixs = [...depositIxs, ...placeOrderIxs]
      return await client.sendAndConfirmTransactionForGroup(group, ixs)
    }
  } catch (e) {
    console.log('failed to execute deposit and place order transaction', e)
  }
}

export enum OrderTypes {
  LIMIT = 'Limit',
  MARKET = 'Market',
}

export enum TriggerOrderTypes {
  STOP_LOSS = 'trade:stop-loss',
  TAKE_PROFIT = 'trade:take-profit',
}
