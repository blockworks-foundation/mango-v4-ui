import { Governance, Proposal, ProposalState } from '@solana/spl-governance'
import dayjs from 'dayjs'

export const isInCoolOffTime = (
  proposal: Proposal | undefined,
  governance: Governance | undefined
) => {
  const mainVotingEndedAt = proposal?.signingOffAt
    ?.addn(governance?.config.maxVotingTime || 0)
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
