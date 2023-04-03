import InlineNotification from '@components/shared/InlineNotification'
import { BN } from '@project-serum/anchor'
import { useWallet } from '@solana/wallet-adapter-react'
import GovernanceStore from '@store/governanceStore'
import { useTranslation } from 'next-i18next'
import {
  MANGO_DAO_WALLET_GOVERNANCE,
  MANGO_MINT_DECIMALS,
} from 'utils/governance/constants'
import { fmtTokenAmount } from 'utils/governance/tools'
import { formatNumericValue } from 'utils/numbers'

const OnBoarding = () => {
  const { connected } = useWallet()
  const { t } = useTranslation(['governance'])
  const governances = GovernanceStore((s) => s.governances)
  const voter = GovernanceStore((s) => s.voter)

  const minVoterWeight = governances
    ? governances[MANGO_DAO_WALLET_GOVERNANCE.toBase58()].account.config
        .minCommunityTokensToCreateProposal
    : new BN(0)
  const mintVoterWeightNumber = governances
    ? fmtTokenAmount(minVoterWeight, MANGO_MINT_DECIMALS)
    : 0

  return voter.voteWeight.cmp(minVoterWeight) !== -1 || !connected ? null : (
    <div className="mb-6">
      <InlineNotification
        type="error"
        title={
          <>
            {t('on-boarding-description', {
              amount: formatNumericValue(mintVoterWeightNumber),
            })}{' '}
            <a
              href="https://dao.mango.markets"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('mango-governance')}
            </a>
          </>
        }
        desc={t('on-boarding-deposit-info')}
      />
    </div>
  )
}

export default OnBoarding
