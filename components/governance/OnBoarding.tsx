import Button from '@components/shared/Button'
import { BN } from '@project-serum/anchor'
import { useWallet } from '@solana/wallet-adapter-react'
import GovernanceStore from '@store/governanceStore'
import { Trans, useTranslation } from 'next-i18next'
import {
  MANGO_DAO_WALLET_GOVERNANCE,
  MANGO_MINT_DECIMALS,
} from 'utils/governance/constants'
import { fmtTokenAmount } from 'utils/governance/tools'
import { formatNumericValue } from 'utils/numbers'

const OnBoarding = () => {
  const { publicKey } = useWallet()
  const { t } = useTranslation(['governance'])
  const { connectionContext, vsrClient, governances, fetchVoterWeight, voter } =
    GovernanceStore()
  const refetchVoterWeight = () => {
    if (!publicKey || !vsrClient || !connectionContext) {
      return
    }
    fetchVoterWeight(publicKey, vsrClient, connectionContext)
  }
  const minVoterWeight = governances
    ? governances[MANGO_DAO_WALLET_GOVERNANCE.toBase58()].account.config
        .minCommunityTokensToCreateProposal
    : new BN(0)
  const mintVoterWeightNumber = governances
    ? fmtTokenAmount(minVoterWeight, MANGO_MINT_DECIMALS)
    : 0

  return voter.voteWeight.cmp(minVoterWeight) !== -1 ? null : (
    <div>
      <h3>{t('on-boarding-title')}</h3>
      <div>
        <Trans>
          {t('on-boarding-description', {
            link: 'https://dao.mango.markets/',
            amount: formatNumericValue(mintVoterWeightNumber),
          })}
        </Trans>
      </div>
      <div>{t('on-boarding-deposit-info')}</div>
      <div>
        <Button onClick={refetchVoterWeight}>{t('tokens-deposited')}</Button>
      </div>
    </div>
  )
}

export default OnBoarding
