import { INITIAL_SOUND_SETTINGS } from '@components/settings/SoundSettings'
import mangoStore from '@store/mangoStore'
import { Howl } from 'howler'
import { NOTIFICATION_API, SOUND_SETTINGS_KEY } from './constants'
import { Payload, SIWS } from '@web3auth/sign-in-with-solana'
import { bs58 } from '@project-serum/anchor/dist/cjs/utils/bytes'
import { WalletContextState } from '@solana/wallet-adapter-react'
import {
  PublicKey,
  Connection,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js'
import { IDL } from '@blockworks-foundation/mango-v4'

export type TransactionNotification = {
  type: 'success' | 'info' | 'error' | 'confirm'
  title: string
  description?: null | string
  txid?: string
  show: boolean
  id: number
}

const successSound = new Howl({
  src: ['/sounds/transaction-success.mp3'],
  volume: 0.5,
})
const failSound = new Howl({
  src: ['/sounds/transaction-fail.mp3'],
  volume: 0.5,
})

export function notify(newNotification: {
  type?: 'success' | 'info' | 'error' | 'confirm'
  title: string
  description?: string
  txid?: string
  noSound?: boolean
  noMangoIdlEnrichment?: boolean
}) {
  const setMangoStore = mangoStore.getState().set
  const notifications = mangoStore.getState().transactionNotifications
  const lastId = mangoStore.getState().transactionNotificationIdCounter
  const newId = lastId + 1
  const savedSoundSettings = localStorage.getItem(SOUND_SETTINGS_KEY)
  const soundSettings = savedSoundSettings
    ? JSON.parse(savedSoundSettings)
    : INITIAL_SOUND_SETTINGS

  if (newNotification.type && !newNotification.noSound) {
    switch (newNotification.type) {
      case 'success': {
        if (soundSettings['transaction-success']) {
          successSound.play()
        }
        break
      }
      case 'error': {
        if (soundSettings['transaction-fail']) {
          failSound.play()
        }
      }
    }
  }

  const newNotif: TransactionNotification = {
    id: newId,
    type: 'success',
    show: true,
    description: null,
    ...newNotification,
  }

  const parsedNotif = !newNotification.noMangoIdlEnrichment
    ? enrichError(newNotif)
    : newNotif
  if (
    !parsedNotif.txid ||
    !notifications.find(
      (n) => n.txid == parsedNotif.txid && n.type == parsedNotif.type,
    )
  ) {
    setMangoStore((state) => {
      state.transactionNotificationIdCounter = newId
      state.transactionNotifications = [...notifications, parsedNotif]
    })
  }
}

const MEMO_PROGRAM_ID = new PublicKey(
  'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
)

const PAYLOAD_STATEMENT = 'Login to Mango Notifications'
const PAYLOAD_VERSION = '1'
const PAYLOAD_CHAIN_ID = 1

export const createSolanaMessage = async (
  wallet: WalletContextState,
  setCookie: (wallet: string, token: string) => void,
) => {
  const payload = new Payload()
  payload.domain = window.location.host
  payload.address = wallet.publicKey!.toBase58()
  payload.uri = window.location.origin
  payload.statement = PAYLOAD_STATEMENT
  payload.version = PAYLOAD_VERSION
  payload.chainId = PAYLOAD_CHAIN_ID

  const message = new SIWS({ payload })

  const messageText = message.prepareMessage()
  const messageEncoded = new TextEncoder().encode(messageText)
  wallet.signMessage!(messageEncoded)
    .then(async (resp) => {
      const tokenResp = await fetch(`${NOTIFICATION_API}auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          signatureString: bs58.encode(resp),
        }),
      })
      const body = await tokenResp.json()
      const token = body.token
      const error = body.error
      if (error) {
        notify({
          type: 'error',
          title: 'Error',
          description: error,
        })
        return
      }
      setCookie(payload.address, token)
    })
    .catch((e) => {
      notify({
        type: 'error',
        title: 'Error',
        description: e.message ? e.message : `${e}`,
      })
    })
}

export const createLedgerMessage = async (
  wallet: WalletContextState,
  setCookie: (wallet: string, token: string) => void,
  connection: Connection,
) => {
  const payload = new Payload()
  payload.domain = window.location.host
  payload.address = wallet.publicKey!.toBase58()
  payload.uri = window.location.origin
  payload.statement = PAYLOAD_STATEMENT
  payload.version = PAYLOAD_VERSION
  payload.chainId = PAYLOAD_CHAIN_ID

  const message = new SIWS({ payload })

  const messageText = message.prepareMessage()
  const tx = new Transaction()

  tx.add(
    new TransactionInstruction({
      programId: MEMO_PROGRAM_ID,
      keys: [],
      data: Buffer.from(messageText),
    }),
  )
  tx.feePayer = wallet.publicKey!
  tx.recentBlockhash = (
    await connection.getLatestBlockhash('processed')
  ).blockhash

  const signedTx = await wallet.signTransaction!(tx)
  const serializedTx = signedTx.serialize()

  const tokenResp = await fetch(`${NOTIFICATION_API}auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...payload,
      isLedger: true,
      serializedTx: Array.from(serializedTx),
    }),
  })
  const body = await tokenResp.json()
  const token = body.token
  const error = body.error
  if (error) {
    notify({
      type: 'error',
      title: 'Error',
      description: error,
    })
    return
  }
  setCookie(payload.address, token)
}

function enrichError(
  unparsedNotification: TransactionNotification,
): TransactionNotification {
  const notification = { ...unparsedNotification }
  if (
    notification.txid &&
    notification.type == 'error' &&
    notification.description
  ) {
    try {
      const errorObject = JSON.parse(notification.description)
      const errorCode = errorObject.value.err.InstructionError[1].Custom
      if (errorCode - 6000 >= 0) {
        const idlError = IDL.errors[errorCode - 6000]
        notification.description = `Error Code ${idlError.code}: ${idlError.name} (${idlError.msg})`
      } else if (errorCode === 1) {
        notification.description = 'Error Code 0x1: Insufficient funds'
      }
    } catch (e) {
      console.log('error while parsing txn error: ', e)
    }
  }
  return notification
}
