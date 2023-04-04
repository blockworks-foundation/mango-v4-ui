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
import { VoteCountdown } from './VoteCountdown'
import { MintInfo } from '@solana/spl-token'
import { MANGO_MINT } from 'utils/constants'
import { PublicKey } from '@solana/web3.js'
import QuorumProgress from './VoteProgress'
import VoteResults from './VoteResult'
import { tryGetMint } from 'utils/governance/tools'

const Vote = () => {
  const connection = mangoStore((s) => s.connection)
  const governances = GovernanceStore((s) => s.governances)

  const [proposals, setProposals] = useState<ProgramAccount<Proposal>[]>([])
  const [mangoMint, setMangoMint] = useState<MintInfo | null>(null)
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
  }, [governances, proposals])

  useEffect(() => {
    const handleGetProposals = async () => {
      const proposals = await getAllProposals(
        connection,
        MANGO_GOVERNANCE_PROGRAM,
        MANGO_REALM_PK
      )
      const mangoMint = await tryGetMint(connection, new PublicKey(MANGO_MINT))
      setMangoMint(mangoMint!.account)
      setProposals(proposals.flatMap((x) => x))
    }
    handleGetProposals()
  }, [])

  return (
    <div>
      <div>
        {votingProposals.map((x) => {
          const governance =
            governances && governances[x.account.governance.toBase58()]

          return (
            governance && (
              <div
                className="border-b border-th-bkg-3 p-4"
                key={x.pubkey.toBase58()}
              >
                <div>{x.account.name}</div>
                <VoteCountdown
                  proposal={x.account}
                  governance={governance.account}
                />
                {mangoMint && (
                  <>
                    <VoteResults
                      communityMint={mangoMint}
                      proposal={x.account}
                    ></VoteResults>
                    <QuorumProgress
                      proposal={x}
                      governance={governance}
                      communityMint={mangoMint}
                    ></QuorumProgress>
                  </>
                )}
              </div>
            )
          )
        })}
      </div>
    </div>
  )
}

export default Vote
