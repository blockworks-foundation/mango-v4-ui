import { Connection, Keypair, TransactionInstruction } from '@solana/web3.js'
import {
  ChatMessageBody,
  getGovernanceProgramVersion,
  GOVERNANCE_CHAT_PROGRAM_ID,
  Proposal,
  TokenOwnerRecord,
  VoteChoice,
  VoteKind,
  withPostChatMessage,
} from '@solana/spl-governance'
import { ProgramAccount } from '@solana/spl-governance'

import { Vote } from '@solana/spl-governance'

import { withCastVote } from '@solana/spl-governance'
import { VsrClient } from '../voteStakeRegistryClient'
import { MANGO_GOVERNANCE_PROGRAM, MANGO_REALM_PK } from '../constants'
import { updateVoterWeightRecord } from './updateVoteWeightRecord'
import { WalletContextState } from '@solana/wallet-adapter-react'
import { MangoClient } from '@blockworks-foundation/mango-v4'
import { notify } from 'utils/notifications'

export async function castVote(
  connection: Connection,
  wallet: WalletContextState,
  proposal: ProgramAccount<Proposal>,
  tokenOwnerRecord: ProgramAccount<TokenOwnerRecord>,
  voteKind: VoteKind,
  vsrClient: VsrClient,
  mangoClient: MangoClient,
  message?: ChatMessageBody | undefined,
) {
  const signers: Keypair[] = []
  const instructions: TransactionInstruction[] = []

  const walletPubkey = wallet.publicKey!
  const governanceAuthority = walletPubkey
  const payer = walletPubkey
  const programVersion = await getGovernanceProgramVersion(
    connection,
    MANGO_GOVERNANCE_PROGRAM,
  )

  const { updateVoterWeightRecordIx, voterWeightPk } =
    await updateVoterWeightRecord(
      vsrClient,
      tokenOwnerRecord.account.governingTokenOwner,
    )
  instructions.push(updateVoterWeightRecordIx)

  // It is not clear that defining these extraneous fields, `deny` and `veto`, is actually necessary.
  // See:  https://discord.com/channels/910194960941338677/910630743510777926/1044741454175674378
  const vote =
    voteKind === VoteKind.Approve
      ? new Vote({
          voteType: VoteKind.Approve,
          approveChoices: [new VoteChoice({ rank: 0, weightPercentage: 100 })],
          deny: undefined,
          veto: undefined,
        })
      : voteKind === VoteKind.Deny
      ? new Vote({
          voteType: VoteKind.Deny,
          approveChoices: undefined,
          deny: true,
          veto: undefined,
        })
      : voteKind == VoteKind.Veto
      ? new Vote({
          voteType: VoteKind.Veto,
          veto: true,
          deny: undefined,
          approveChoices: undefined,
        })
      : new Vote({
          voteType: VoteKind.Abstain,
          veto: undefined,
          deny: undefined,
          approveChoices: undefined,
        })

  const tokenMint = proposal.account.governingTokenMint

  await withCastVote(
    instructions,
    MANGO_GOVERNANCE_PROGRAM,
    programVersion,
    MANGO_REALM_PK,
    proposal.account.governance,
    proposal.pubkey,
    proposal.account.tokenOwnerRecord,
    tokenOwnerRecord.pubkey,
    governanceAuthority,
    tokenMint,
    vote,
    payer,
    voterWeightPk,
  )

  if (message) {
    const { updateVoterWeightRecordIx, voterWeightPk } =
      await updateVoterWeightRecord(
        vsrClient,
        tokenOwnerRecord.account.governingTokenOwner,
      )
    instructions.push(updateVoterWeightRecordIx)

    await withPostChatMessage(
      instructions,
      signers,
      GOVERNANCE_CHAT_PROGRAM_ID,
      MANGO_GOVERNANCE_PROGRAM,
      MANGO_REALM_PK,
      proposal.account.governance,
      proposal.pubkey,
      tokenOwnerRecord.pubkey,
      governanceAuthority,
      payer,
      undefined,
      message,
      voterWeightPk,
    )
  }

  const tx = await mangoClient.sendAndConfirmTransaction(instructions)
  notify({
    title: 'Transaction confirmed',
    type: 'success',
    txid: tx.signature,
    noSound: true,
  })
}
