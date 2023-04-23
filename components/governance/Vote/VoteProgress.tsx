import Tooltip from '@components/shared/Tooltip'
import {
  CheckCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/20/solid'
import { Governance, ProgramAccount, Proposal } from '@solana/spl-governance'
import { RawMint } from '@solana/spl-token'
import GovernanceStore from '@store/governanceStore'
import { useTranslation } from 'next-i18next'
import { getMintMaxVoteWeight } from 'utils/governance/proposals'
import { fmtTokenAmount } from 'utils/governance/tools'

type Props = {
  governance: ProgramAccount<Governance>
  proposal: ProgramAccount<Proposal>
  communityMint: RawMint
}

const QuorumProgress = ({ governance, proposal, communityMint }: Props) => {
  const { t } = useTranslation(['governance'])

  const realm = GovernanceStore((s) => s.realm)

  const voteThresholdPct =
    governance.account.config.communityVoteThreshold.value || 0

  const maxVoteWeight =
    realm &&
    getMintMaxVoteWeight(
      communityMint,
      realm.account.config.communityMintMaxVoteWeightSource
    )

  const minimumYesVotes =
    fmtTokenAmount(maxVoteWeight!, communityMint.decimals) *
    (voteThresholdPct / 100)

  const yesVoteCount = fmtTokenAmount(
    proposal.account.getYesVoteCount(),
    communityMint.decimals
  )

  const rawYesVotesRequired = minimumYesVotes - yesVoteCount
  const votesRequiredInRange = rawYesVotesRequired < 0 ? 0 : rawYesVotesRequired
  const yesVoteProgress = votesRequiredInRange
    ? 100 - (votesRequiredInRange / minimumYesVotes) * 100
    : 100
  const yesVotesRequired =
    communityMint.decimals == 0
      ? Math.ceil(votesRequiredInRange)
      : votesRequiredInRange

  return (
    <div className="w-full rounded-md">
      <div className="flex items-center">
        <div className="w-full">
          <div className="flex items-center">
            <p className="text-fgd-2 mb-0 mr-1.5">{t('approval-q')}</p>
            <Tooltip content={t('quorum-description')}>
              <InformationCircleIcon className="text-fgd-2 h-5 w-5 cursor-help" />
            </Tooltip>
          </div>
          {typeof yesVoteProgress !== 'undefined' && yesVoteProgress < 100 ? (
            <p className="text-fgd-1 mb-0 font-bold">{`${(
              yesVotesRequired ?? 0
            ).toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })} ${(yesVoteProgress ?? 0) > 0 ? 'more' : ''} Yes vote${
              (yesVotesRequired ?? 0) > 1 ? 's' : ''
            } required`}</p>
          ) : (
            <div className="flex items-center">
              <CheckCircleIcon className="text-green mr-1.5 h-5 w-5 flex-shrink-0" />
              <p className="text-fgd-1 mb-0 font-bold">
                {t('required-approval-achieved')}
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="mt-2.5 flex h-2 w-full flex-grow rounded bg-th-bkg-4">
        <div
          style={{
            width: `${yesVoteProgress}%`,
          }}
          className={`${
            (yesVoteProgress ?? 0) >= 100 ? 'bg-th-up' : 'bg-th-fgd-2'
          } flex rounded`}
        ></div>
      </div>
    </div>
  )
}

export default QuorumProgress
