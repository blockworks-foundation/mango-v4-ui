import { IDL } from '@blockworks-foundation/mango-v4'
import { BorshInstructionCoder } from '@project-serum/anchor'
import { Connection } from '@solana/web3.js'
import { MANGO_DATA_API_URL } from './constants'
import { TxCallbackOptions } from '@blockworks-foundation/mango-v4/dist/types/src/client'

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
  ).catch((e) =>
    txConfirmationInner(
      start,
      rpcEndpoint,
      prioritizationFee,
      txCallbackOptions,
    ),
  )
}

async function txConfirmationInner(
  startTime: number,
  rpcEndpoint: string,
  prioritization_fee: number,
  txCallbackOptions: TxCallbackOptions,
) {
  const connection = new Connection(rpcEndpoint, 'processed')
  const { txid: signature, txSignatureBlockHash } = txCallbackOptions
  await connection.confirmTransaction(
    {
      signature,
      blockhash: txSignatureBlockHash.blockhash,
      lastValidBlockHeight: txSignatureBlockHash.lastValidBlockHeight,
    },
    'processed',
  )
  const elapsed = new Date().getTime() - startTime

  await connection.confirmTransaction(
    {
      signature,
      blockhash: txSignatureBlockHash.blockhash,
      lastValidBlockHeight: txSignatureBlockHash.lastValidBlockHeight,
    },
    'confirmed',
  )

  const confirmedTxn = await connection.getTransaction(signature, {
    commitment: 'confirmed',
    maxSupportedTransactionVersion: 0,
  })

  // search message ixs only (as opposed to inner)
  // it's ok to do this since Mango does not CPI into itself and these metrics are for the frontend only
  const messageInstructions =
    confirmedTxn?.transaction.message.compiledInstructions
  const instructionNames = []
  if (messageInstructions) {
    for (let ix of messageInstructions) {
      const parsedInstruction = coder.decode(Buffer.from(ix.data))
      if (parsedInstruction) {
        instructionNames.push(parsedInstruction.name)
      }
    }
  }

  const confirmed = confirmedTxn !== null
  const error =
    confirmedTxn?.meta?.err !== null && confirmedTxn?.meta?.err !== undefined
  const block_datetime = confirmedTxn?.blockTime
    ? new Date(confirmedTxn.blockTime * 1000).toISOString()
    : null

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
    processed_slot: confirmedTxn?.slot,
    instruction_names: instructionNames.join(','),
    loaded_addresses,
    prioritization_fee,
    compute_units_consumed: confirmedTxn?.meta?.computeUnitsConsumed,
    fee_lamports: confirmedTxn?.meta?.fee,
  }

  const resp = await fetch(`${MANGO_DATA_API_URL}/transaction-confirmation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  const body = await resp.json()
  // console.log(body)
}
