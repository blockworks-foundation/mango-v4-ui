import { Wallet } from '@coral-xyz/anchor'
import { isVersionedTransaction } from '@solana/wallet-adapter-base'
import {
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js'

export default class EmptyWallet implements Wallet {
  constructor(readonly payer: Keypair) {}

  async signTransaction<T extends Transaction | VersionedTransaction>(
    tx: T,
  ): Promise<T> {
    if (isVersionedTransaction(tx)) {
      tx.sign([this.payer])
    } else {
      tx.partialSign(this.payer)
    }
    return tx
  }
  async signAllTransactions<T extends Transaction | VersionedTransaction>(
    txs: T[],
  ): Promise<T[]> {
    return txs.map((t) => {
      if (isVersionedTransaction(t)) {
        t.sign([this.payer])
      } else {
        t.partialSign(this.payer)
      }
      return t
    })
  }

  get publicKey(): PublicKey {
    return this.payer.publicKey
  }
}
