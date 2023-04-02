import {
  ProgramAccount,
  Proposal,
  ProposalState,
  getAllProposals,
} from '@solana/spl-governance'
import GovernanceStore from '@store/governanceStore'
import mangoStore from '@store/mangoStore'
import { useEffect, useState } from 'react'
import {
  MANGO_GOVERNANCE_PROGRAM,
  MANGO_REALM_PK,
} from 'utils/governance/constants'
import { isInCoolOffTime } from 'utils/governance/proposals'

const Vote = () => {
  const { connection } = mangoStore()
  const { governances } = GovernanceStore()
  const [proposals, setProposals] = useState<ProgramAccount<Proposal>[]>([])
  const [votingProposals, setVotingProposals] = useState<
    ProgramAccount<Proposal>[]
  >([])

  useEffect(() => {
    const activeProposals = proposals.filter((x) => {
      const governance =
        governances && governances[x.account.governance.toBase58()]
      const votingEnded =
        governance && x.account.getTimeToVoteEnd(governance.account) < 0

      const coolOff = isInCoolOffTime(x.account, governance?.account)
      return (
        !coolOff && !votingEnded && x.account.state === ProposalState.Voting
      )
    })
    setVotingProposals(activeProposals)
  }, [governances?.length, proposals.length])

  useEffect(() => {
    const handleGetProposals = async () => {
      const proposals = await getAllProposals(
        connection,
        MANGO_GOVERNANCE_PROGRAM,
        MANGO_REALM_PK
      )
      setProposals(proposals.flatMap((x) => x))
    }
    handleGetProposals()
  }, [])

  return (
    <div>
      <div>
        {votingProposals.map((x) => (
          <div key={x.pubkey.toBase58()}>
            <div>{x.account.name}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Vote
