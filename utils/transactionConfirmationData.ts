import { IDL } from '@blockworks-foundation/mango-v4'
import { BorshInstructionCoder } from '@project-serum/anchor'
import { Connection } from '@solana/web3.js'
import { MANGO_DATA_API_URL } from './constants'
import { TxCallbackOptions } from '@blockworks-foundation/mango-v4/dist/types/src/client'
import { awaitTransactionSignatureConfirmation } from '@blockworks-foundation/mangolana/lib/transactions'

const coder = new BorshInstructionCoder(IDL)

export function collectTxConfirmationData(
  rpcEndpoint: string,
  prioritizationFee: number,
  txCallbackOptions: TxCallbackOptions,
) {
  const start = new Date().getTime()
  txConfirmationInner(
    start,
    rpcEndpoint,
    prioritizationFee,
    txCallbackOptions,
  ).catch(() => {
    return txConfirmationInner(
      start,
      rpcEndpoint,
      prioritizationFee,
      txCallbackOptions,
    )
  })
}

async function txConfirmationInner(
  startTime: number,
  rpcEndpoint: string,
  prioritization_fee: number,
  txCallbackOptions: TxCallbackOptions,
) {
  const connection = new Connection(rpcEndpoint, 'processed')
  const { txid: signature, txSignatureBlockHash } = txCallbackOptions
  try {
    await awaitTransactionSignatureConfirmation({
      txid: signature,
      confirmLevel: 'processed',
      connection: connection,
      timeoutStrategy: {
        block: txSignatureBlockHash,
      },
    })
    // eslint-disable-next-line no-empty
  } catch (e) {}

  const elapsed = new Date().getTime() - startTime

  try {
    await awaitTransactionSignatureConfirmation({
      txid: signature,
      confirmLevel: 'confirmed',
      connection: connection,
      timeoutStrategy: {
        block: txSignatureBlockHash,
      },
    })
    // eslint-disable-next-line no-empty
  } catch (e) {}

  const confirmedTxn = await connection.getTransaction(signature, {
    commitment: 'confirmed',
    maxSupportedTransactionVersion: 0,
  })

  // search message ixs only (as opposed to inner)
  // it's ok to do this since Mango does not CPI into itself and these metrics are for the frontend only
  const messageInstructions =
    confirmedTxn?.transaction.message.compiledInstructions ||
    txCallbackOptions.instructions?.message.compiledInstructions
  const instructionNames = []
  if (messageInstructions) {
    for (const ix of messageInstructions) {
      const parsedInstruction = coder.decode(Buffer.from(ix.data))
      if (parsedInstruction) {
        instructionNames.push(parsedInstruction.name)
      }
    }
  }

  const confirmed = confirmedTxn !== null
  const error =
    confirmedTxn?.meta?.err !== null && confirmedTxn?.meta?.err !== undefined
  const signBlockTime = await connection.getBlockTime(txSignatureBlockHash.slot)
  let backupBlockTime = null

  if (!confirmedTxn && signBlockTime) {
    backupBlockTime = new Date(signBlockTime * 1000).toISOString()
  }

  const block_datetime = confirmedTxn?.blockTime
    ? new Date(confirmedTxn.blockTime * 1000).toISOString()
    : backupBlockTime || new Date().toISOString()

  const loaded_addresses =
    (confirmedTxn?.meta?.loadedAddresses?.readonly.length ?? 0) +
    (confirmedTxn?.meta?.loadedAddresses?.writable.length ?? 0)

  const data = {
    signature,
    block_datetime,
    confirmed,
    error,
    ui_confirmation_time_ms: elapsed,
    fetch_blockhash_slot: txSignatureBlockHash.slot,
    processed_slot: confirmedTxn?.slot || txSignatureBlockHash.slot,
    instruction_names: instructionNames.join(','),
    loaded_addresses,
    prioritization_fee,
    compute_units_consumed: confirmedTxn?.meta?.computeUnitsConsumed || 0,
    fee_lamports: confirmedTxn?.meta?.fee || 0,
  }

  await fetch(`${MANGO_DATA_API_URL}/transaction-confirmation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
}
