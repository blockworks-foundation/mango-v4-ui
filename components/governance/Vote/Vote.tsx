import { ProgramAccount, Proposal, ProposalState } from '@solana/spl-governance'
import GovernanceStore from '@store/governanceStore'
import mangoStore from '@store/mangoStore'
import { useEffect, useState } from 'react'
import { isInCoolOffTime } from 'utils/governance/proposals'
import { MintInfo } from '@solana/spl-token'
import { MANGO_MINT } from 'utils/constants'
import { PublicKey } from '@solana/web3.js'
import { tryGetMint } from 'utils/governance/tools'
import OnBoarding from '../OnBoarding'
import { BN } from '@project-serum/anchor'
import ProposalCard from './ProposalCard'
import Loading from '@components/shared/Loading'
import { useTranslation } from 'next-i18next'

const Vote = () => {
  const { t } = useTranslation(['governance'])
  const connection = mangoStore((s) => s.connection)
  const governances = GovernanceStore((s) => s.governances)
  const proposals = GovernanceStore((s) => s.proposals)
  const loadingProposals = GovernanceStore((s) => s.loadingProposals)
  const loadingVoter = GovernanceStore((s) => s.loadingVoter)
  const loadingRealm = GovernanceStore((s) => s.loadingRealm)

  const [mangoMint, setMangoMint] = useState<MintInfo | null>(null)
  const [votingProposals, setVotingProposals] = useState<
    ProgramAccount<Proposal>[]
  >([])

  useEffect(() => {
    if (proposals) {
      const activeProposals = Object.values(proposals).filter((x) => {
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
    } else {
      setVotingProposals([])
    }
  }, [governances, proposals])

  useEffect(() => {
    const handleGetMangoMint = async () => {
      const mangoMint = await tryGetMint(connection, new PublicKey(MANGO_MINT))
      setMangoMint(mangoMint!.account)
    }
    handleGetMangoMint()
  }, [])

  return (
    <div>
      {loadingProposals || loadingRealm ? (
        <Loading className="w-5"></Loading>
      ) : (
        <div>
          <h1 className="mb-4">{t('current-proposals')}</h1>
          {!loadingVoter && (
            <OnBoarding minVotes={new BN(1000000)}></OnBoarding>
          )}
          {votingProposals.map(
            (x) =>
              mangoMint && (
                <ProposalCard
                  key={x.pubkey.toBase58()}
                  proposal={x}
                  mangoMint={mangoMint}
                ></ProposalCard>
              )
          )}
        </div>
      )}
    </div>
  )
}

export default Vote
