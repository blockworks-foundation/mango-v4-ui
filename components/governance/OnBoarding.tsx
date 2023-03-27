import Button from '@components/shared/Button'
import { useWallet } from '@solana/wallet-adapter-react'
import GovernanceStore from '@store/governanceStore'
import {
  MANGO_DAO_WALLET_GOVERNANCE,
  MANGO_MINT_DECIMALS,
} from 'utils/governance/constants'
import { fmtTokenAmount } from 'utils/governance/tools'
import { formatNumericValue } from 'utils/numbers'

const OnBoarding = () => {
  const { publicKey } = useWallet()
  const { connectionContext, vsrClient, governances, fetchVoterWeight } =
    GovernanceStore()
  const refetchVoterWeight = () => {
    if (!publicKey || !vsrClient || !connectionContext) {
      return
    }
    fetchVoterWeight(publicKey, vsrClient, connectionContext)
  }
  const minimumDeposit = governances
    ? fmtTokenAmount(
        governances[MANGO_DAO_WALLET_GOVERNANCE.toBase58()].account.config
          .minCommunityTokensToCreateProposal,
        MANGO_MINT_DECIMALS
      )
    : 0
  return (
    <div>
      <h3>
        Looks like currently connected wallet doesnt have any MNGO deposited
        inside realms
      </h3>
      <div>
        In order to create proposals here or inside realms please go to
        https://dao.mango.markets/ and deposit minimum{' '}
        {formatNumericValue(minimumDeposit)} MNGO
      </div>
      <div>
        deposit will be be temporarily blocked for the voting period of proposal
        after the end of proposal you can withdraw tokens
      </div>
      <div>
        <Button onClick={refetchVoterWeight}>Tokens Deposited</Button>
      </div>
    </div>
  )
}

export default OnBoarding
