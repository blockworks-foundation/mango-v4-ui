import { ProgramAccount, Proposal, ProposalState } from '@solana/spl-governance'
import GovernanceStore from '@store/governanceStore'
import mangoStore from '@store/mangoStore'
import { useEffect, useState } from 'react'
import { isInCoolOffTime } from 'utils/governance/proposals'
import { MintInfo } from '@solana/spl-token'
import { MANGO_MINT } from 'utils/constants'
import { PublicKey } from '@solana/web3.js'
import dynamic from 'next/dynamic'
import { fmtTokenAmount, tryGetMint } from 'utils/governance/tools'
import { BN } from '@project-serum/anchor'
import { MANGO_MINT_DECIMALS } from 'utils/governance/constants'
import { useTranslation } from 'next-i18next'
import SheenLoader from '@components/shared/SheenLoader'
import { NoSymbolIcon } from '@heroicons/react/20/solid'

const ProposalCard = dynamic(() => import('./ProposalCard'))
const OnBoarding = dynamic(() => import('../OnBoarding'))

const Vote = () => {
  const { t } = useTranslation('governance')
  const connection = mangoStore((s) => s.connection)
  const governances = GovernanceStore((s) => s.governances)
  const proposals = GovernanceStore((s) => s.proposals)
  const loadingProposals = GovernanceStore((s) => s.loadingProposals)
  const voter = GovernanceStore((s) => s.voter)
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
      <div className="mb-4 flex flex-wrap items-end justify-between">
        <h1 className="mr-4">{t('active-proposals')}</h1>
        <p className="whitespace-no-wrap mb-0.5 mt-2">
          {t('your-votes')}{' '}
          <span className="font-mono text-th-fgd-2">
            {!loadingVoter
              ? fmtTokenAmount(voter.voteWeight, MANGO_MINT_DECIMALS)
              : 0}
          </span>
        </p>
      </div>
      {loadingProposals || loadingRealm ? (
        <div className="space-y-3">
          <SheenLoader className="flex flex-1">
            <div className={`h-56 w-full bg-th-bkg-2`} />
          </SheenLoader>
          <SheenLoader className="flex flex-1">
            <div className={`h-56 w-full bg-th-bkg-2`} />
          </SheenLoader>
        </div>
      ) : (
        <>
          {!loadingVoter ? (
            <OnBoarding minVotes={new BN(1000000)}></OnBoarding>
          ) : null}
          <div className="space-y-3">
            {votingProposals.length ? (
              votingProposals.map(
                (x) =>
                  mangoMint && (
                    <ProposalCard
                      key={x.pubkey.toBase58()}
                      proposal={x}
                      mangoMint={mangoMint}
                    ></ProposalCard>
                  )
              )
            ) : (
              <div className="flex h-56 items-center justify-center rounded-lg border border-th-bkg-3 p-6">
                <div className="flex flex-col items-center">
                  <NoSymbolIcon className="mb-1 h-6 w-6" />
                  <p>{t('no-active-proposals')}</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Vote
