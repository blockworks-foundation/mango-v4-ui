import GovernanceDelegateModal from '@components/modals/governance/GovernanceDelegateModal'
import Button from '@components/shared/Button'
import GovernanceStore from '@store/governanceStore'
import { useTranslation } from 'next-i18next'
import { useState } from 'react'
import { MANGO_MINT_DECIMALS } from 'utils/governance/constants'
import { fmtTokenAmount } from 'utils/governance/tools'

const VotingPower = () => {
  const { t } = useTranslation('governance')
  const voter = GovernanceStore((s) => s.voter)
  const loadingVoter = GovernanceStore((s) => s.loadingVoter)

  const [delegateModal, setDelegateModal] = useState(false)

  return (
    <p className="whitespace-no-wrap mb-0.5 mt-2">
      <Button
        onClick={() => setDelegateModal(true)}
        className="mr-4"
        size="small"
      >
        {t('use-delegate')}
      </Button>
      <GovernanceDelegateModal
        isOpen={delegateModal}
        onClose={() => setDelegateModal(false)}
      ></GovernanceDelegateModal>
      {t('your-votes')}{' '}
      <span className="font-mono text-th-fgd-2">
        {!loadingVoter
          ? fmtTokenAmount(voter.voteWeight, MANGO_MINT_DECIMALS)
          : 0}
      </span>
    </p>
  )
}

export default VotingPower
