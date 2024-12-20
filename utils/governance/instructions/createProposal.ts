import {
  getGovernanceProgramVersion,
  getInstructionDataFromBase64,
  getSignatoryRecordAddress,
  ProgramAccount,
  serializeInstructionToBase64,
  TokenOwnerRecord,
  VoteType,
  WalletSigner,
  withAddSignatory,
  withCreateProposal,
  withInsertTransaction,
  withSignOffProposal,
} from '@realms-today/spl-governance'
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js'
import chunk from 'lodash/chunk'
import { MANGO_MINT } from 'utils/constants'
import { MANGO_GOVERNANCE_PROGRAM, MANGO_REALM_PK } from '../constants'
import { VsrClient } from '../voteStakeRegistryClient'
import { updateVoterWeightRecord } from './updateVoteWeightRecord'
import {
  createComputeBudgetIx,
  MangoClient,
} from '@blockworks-foundation/mango-v4'
import { sendTxAndConfirm } from '../tools'

export const createProposal = async (
  connection: Connection,
  mangoClient: MangoClient,
  wallet: WalletSigner,
  governance: PublicKey,
  tokenOwnerRecord: ProgramAccount<TokenOwnerRecord>,
  name: string,
  descriptionLink: string,
  proposalIndex: number,
  proposalInstructions: TransactionInstruction[],
  client: VsrClient | null,
  fee: number,
  mint?: PublicKey,
  realm?: PublicKey,
) => {
  const instructions: TransactionInstruction[] = []
  const walletPk = wallet.publicKey!
  const governanceAuthority = walletPk
  const signatory = walletPk
  const payer = walletPk
  let vsrVoterWeightPk: PublicKey | undefined = undefined

  // Changed this because it is misbehaving on my local validator setup.
  const programVersion = await getGovernanceProgramVersion(
    connection,
    MANGO_GOVERNANCE_PROGRAM,
  )

  // V2 Approve/Deny configuration
  const voteType = VoteType.SINGLE_CHOICE
  const options = ['Approve']
  const useDenyOption = true

  if (client) {
    const { updateVoterWeightRecordIx, voterWeightPk } =
      await updateVoterWeightRecord(
        client,
        tokenOwnerRecord.account.governingTokenOwner,
      )
    vsrVoterWeightPk = voterWeightPk
    instructions.push(updateVoterWeightRecordIx)
  }

  const proposalAddress = await withCreateProposal(
    instructions,
    MANGO_GOVERNANCE_PROGRAM,
    programVersion,
    realm || MANGO_REALM_PK,
    governance,
    tokenOwnerRecord.pubkey,
    name,
    descriptionLink,
    mint || new PublicKey(MANGO_MINT),
    governanceAuthority,
    proposalIndex,
    voteType,
    options,
    useDenyOption,
    payer,
    vsrVoterWeightPk,
  )

  await withAddSignatory(
    instructions,
    MANGO_GOVERNANCE_PROGRAM,
    programVersion,
    proposalAddress,
    tokenOwnerRecord.pubkey,
    governanceAuthority,
    signatory,
    payer,
  )

  const signatoryRecordAddress = await getSignatoryRecordAddress(
    MANGO_GOVERNANCE_PROGRAM,
    proposalAddress,
    signatory,
  )
  const insertInstructions: TransactionInstruction[] = []
  for (const i in proposalInstructions) {
    const instruction = getInstructionDataFromBase64(
      serializeInstructionToBase64(proposalInstructions[i]),
    )
    await withInsertTransaction(
      insertInstructions,
      MANGO_GOVERNANCE_PROGRAM,
      programVersion,
      governance,
      proposalAddress,
      tokenOwnerRecord.pubkey,
      governanceAuthority,
      Number(i),
      0,
      0,
      [instruction],
      payer,
    )
  }
  withSignOffProposal(
    insertInstructions, // SingOff proposal needs to be executed after inserting instructions hence we add it to insertInstructions
    MANGO_GOVERNANCE_PROGRAM,
    programVersion,
    realm || MANGO_REALM_PK,
    governance,
    proposalAddress,
    signatory,
    signatoryRecordAddress,
    undefined,
  )

  const txChunks = chunk([...instructions, ...insertInstructions], 2)

  const transactions: Transaction[] = []
  const latestBlockhash = await connection.getLatestBlockhash('processed')

  for (const chunk of txChunks) {
    const tx = new Transaction()
    tx.add(createComputeBudgetIx(fee))
    tx.add(...chunk)
    tx.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight
    tx.recentBlockhash = latestBlockhash.blockhash
    tx.feePayer = payer
    transactions.push(tx)
  }
  const signedTransactions = await wallet.signAllTransactions(transactions)
  for (const tx of signedTransactions) {
    await sendTxAndConfirm(
      mangoClient.opts.multipleConnections,
      connection,
      tx,
      latestBlockhash,
    )
  }
  return proposalAddress
}
