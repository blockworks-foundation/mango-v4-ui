import { BN } from '@coral-xyz/anchor'
import {
  Governance,
  MintMaxVoteWeightSource,
  MintMaxVoteWeightSourceType,
  Proposal,
  ProposalState,
} from '@solana/spl-governance'
import BigNumber from 'bignumber.js'
import dayjs from 'dayjs'
import { RawMint } from '@solana/spl-token'

export const isInCoolOffTime = (
  proposal: Proposal | undefined,
  governance: Governance | undefined,
) => {
  const mainVotingEndedAt = proposal?.signingOffAt
    ?.addn(governance?.config.baseVotingTime || 0)
    .toNumber()

  const votingCoolOffTime = governance?.config.votingCoolOffTime || 0
  const canFinalizeAt = mainVotingEndedAt
    ? mainVotingEndedAt + votingCoolOffTime
    : mainVotingEndedAt

  const endOfProposalAndCoolOffTime = canFinalizeAt
    ? dayjs(1000 * canFinalizeAt!)
    : undefined

  const isInCoolOffTime = endOfProposalAndCoolOffTime
    ? dayjs().isBefore(endOfProposalAndCoolOffTime) &&
      mainVotingEndedAt &&
      dayjs().isAfter(mainVotingEndedAt * 1000)
    : undefined

  return !!isInCoolOffTime && proposal!.state !== ProposalState.Defeated
}

/** Returns max VoteWeight for given mint and max source */
export function getMintMaxVoteWeight(
  mint: RawMint,
  maxVoteWeightSource: MintMaxVoteWeightSource,
) {
  if (maxVoteWeightSource.type === MintMaxVoteWeightSourceType.SupplyFraction) {
    const supplyFraction = maxVoteWeightSource.getSupplyFraction()

    const maxVoteWeight = new BigNumber(supplyFraction.toString())
      .multipliedBy(mint.supply.toString())
      .shiftedBy(-MintMaxVoteWeightSource.SUPPLY_FRACTION_DECIMALS)

    return new BN(maxVoteWeight.dp(0, BigNumber.ROUND_DOWN).toString())
  } else {
    // absolute value
    return maxVoteWeightSource.value
  }
}

export const calculatePct = (c = new BN(0), total?: BN) => {
  if (total?.isZero()) {
    return 0
  }

  return new BN(100)
    .mul(c)
    .div(total ?? new BN(1))
    .toNumber()
}
