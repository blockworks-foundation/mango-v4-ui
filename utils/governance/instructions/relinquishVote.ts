import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js'
import {
  getGovernanceProgramVersion,
  Proposal,
  TokenOwnerRecord,
  withRelinquishVote,
} from '@solana/spl-governance'
import { ProgramAccount } from '@solana/spl-governance'
import { MANGO_GOVERNANCE_PROGRAM, MANGO_REALM_PK } from '../constants'
import { WalletContextState } from '@solana/wallet-adapter-react'
import { MangoClient } from '@blockworks-foundation/mango-v4'
import { notify } from 'utils/notifications'

export async function relinquishVote(
  connection: Connection,
  wallet: WalletContextState,
  proposal: ProgramAccount<Proposal>,
  tokenOwnerRecord: ProgramAccount<TokenOwnerRecord>,
  mangoClient: MangoClient,
  voteRecord: PublicKey,
) {
  const instructions: TransactionInstruction[] = []
  const governanceAuthority = wallet.publicKey!
  const beneficiary = wallet.publicKey!

  const programVersion = await getGovernanceProgramVersion(
    connection,
    MANGO_GOVERNANCE_PROGRAM,
  )

  await withRelinquishVote(
    instructions,
    MANGO_GOVERNANCE_PROGRAM,
    programVersion,
    MANGO_REALM_PK,
    proposal.account.governance,
    proposal.pubkey,
    tokenOwnerRecord.pubkey,
    proposal.account.governingTokenMint,
    voteRecord,
    governanceAuthority,
    beneficiary,
  )

  const tx = await mangoClient.sendAndConfirmTransaction(instructions)
  notify({
    title: 'Transaction confirmed',
    type: 'success',
    txid: tx.signature,
    noSound: true,
  })
}
