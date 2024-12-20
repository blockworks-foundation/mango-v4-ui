import { PublicKey } from '@solana/web3.js'
import { MANGO_MINT, MANGO_REALM_PK } from '../constants'
import { DEFAULT_VSR_ID, VsrClient } from '../voteStakeRegistryClient'
import {
  getRegistrarPDA,
  getVoterPDA,
  getVoterWeightPDA,
} from '../accounts/vsrAccounts'
import { SYSTEM_PROGRAM_ID } from '@realms-today/spl-governance'

export const updateVoterWeightRecord = async (
  client: VsrClient,
  walletPk: PublicKey,
) => {
  const { registrar } = await getRegistrarPDA(
    MANGO_REALM_PK,
    new PublicKey(MANGO_MINT),
    DEFAULT_VSR_ID,
  )
  const { voter } = await getVoterPDA(registrar, walletPk, DEFAULT_VSR_ID)
  const { voterWeightPk } = await getVoterWeightPDA(
    registrar,
    walletPk,
    DEFAULT_VSR_ID,
  )
  const updateVoterWeightRecordIx = await client!.program.methods
    .updateVoterWeightRecord()
    .accounts({
      registrar,
      voter,
      voterWeightRecord: voterWeightPk,
      systemProgram: SYSTEM_PROGRAM_ID,
    })
    .instruction()
  return { updateVoterWeightRecordIx, voterWeightPk }
}
