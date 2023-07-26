import { Proposal } from '@solana/spl-governance'
import VoteResultsBar from './VoteResultBar'
import { fmtTokenAmount } from 'utils/governance/tools'
import { RawMint } from '@solana/spl-token'
import { useTranslation } from 'next-i18next'
import { BN } from '@coral-xyz/anchor'

type VoteResultsProps = {
  proposal: Proposal
  communityMint: RawMint
}

const VoteResults = ({ proposal, communityMint }: VoteResultsProps) => {
  const { t } = useTranslation(['governance'])

  const yesVoteCount = fmtTokenAmount(
    proposal.getYesVoteCount() as BN,
    communityMint.decimals,
  )
  const noVoteCount = fmtTokenAmount(
    proposal.getNoVoteCount() as BN,
    communityMint.decimals,
  )
  const totalVoteCount = yesVoteCount + noVoteCount
  const getRelativeVoteCount = (voteCount: number) =>
    totalVoteCount === 0 ? 0 : (voteCount / totalVoteCount) * 100
  const relativeYesVotes = getRelativeVoteCount(yesVoteCount)
  const relativeNoVotes = getRelativeVoteCount(noVoteCount)

  return (
    <div className="flex w-full items-center space-x-4">
      {proposal ? (
        <div className={`w-full rounded-md`}>
          <div className="flex">
            <div className="w-1/2">
              <p>{t('yes-votes')}</p>
              <p className={`hero-text font-bold text-th-fgd-1`}>
                {(yesVoteCount ?? 0).toLocaleString()}
                <span className="ml-1 text-xs font-normal text-th-fgd-3">
                  {relativeYesVotes?.toFixed(1)}%
                </span>
              </p>
            </div>
            <div className="w-1/2 text-right">
              <p>{t('no-votes')}</p>
              <p className={`hero-text font-bold text-th-fgd-1`}>
                {(noVoteCount ?? 0).toLocaleString()}
                <span className="ml-1 text-xs font-normal text-th-fgd-3">
                  {relativeNoVotes?.toFixed(1)}%
                </span>
              </p>
            </div>
          </div>
          <VoteResultsBar
            approveVotePercentage={relativeYesVotes!}
            denyVotePercentage={relativeNoVotes!}
          />
        </div>
      ) : (
        <>
          <div className="h-12 w-full animate-pulse rounded bg-th-bkg-3" />
        </>
      )}
    </div>
  )
}

export default VoteResults
