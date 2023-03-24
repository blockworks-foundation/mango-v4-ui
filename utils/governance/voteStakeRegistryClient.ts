import { Program, Provider, web3 } from '@coral-xyz/anchor'
import { IDL, VoterStakeRegistry } from './voterStakeRegistryIDL'

export const DEFAULT_VSR_ID = new web3.PublicKey(
  '4Q6WW2ouZ6V3iaNm56MTd5n2tnTm4C5fiH8miFHnAFHo'
)

export class VsrClient {
  constructor(
    public program: Program<VoterStakeRegistry>,
    public devnet?: boolean
  ) {}

  static connect(
    provider: Provider,
    programId: web3.PublicKey,
    devnet?: boolean
  ): VsrClient {
    const idl = IDL

    return new VsrClient(
      new Program<VoterStakeRegistry>(idl, programId, provider),
      devnet
    )
  }
}
