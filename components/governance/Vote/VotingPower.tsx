import GovernanceDelegate from '@components/governance/GovernanceDelegate'
import GovernanceStore from '@store/governanceStore'
import { useTranslation } from 'next-i18next'
import { MANGO_MINT_DECIMALS } from 'utils/governance/constants'
import { fmtTokenAmount } from 'utils/governance/tools'

const VotingPower = () => {
  const { t } = useTranslation('governance')
  const voter = GovernanceStore((s) => s.voter)
  const loadingVoter = GovernanceStore((s) => s.loadingVoter)

  return (
    <p className="whitespace-no-wrap mb-0.5 mt-2 flex items-center">
      <GovernanceDelegate />
      <div className="ml-4 flex h-10 items-center rounded-full bg-th-bkg-2 px-4">
        <span className="mr-1">{t('your-votes')}</span>
        <span className="font-mono text-th-fgd-2">
          {!loadingVoter
            ? fmtTokenAmount(voter.voteWeight, MANGO_MINT_DECIMALS)
            : 0}
        </span>
      </div>
    </p>
  )
}

export default VotingPower
