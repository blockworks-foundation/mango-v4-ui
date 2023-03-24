import Button from '@components/shared/Button'
import { useWallet } from '@solana/wallet-adapter-react'
import GovernanceStore from '@store/governanceStore'

const OnBoarding = () => {
  const { publicKey } = useWallet()
  const {
    connectionContext,

    vsrClient,

    fetchVoterWeight,
  } = GovernanceStore()
  const refetchVoterWeight = () => {
    if (!publicKey || !vsrClient || !connectionContext) {
      return
    }
    fetchVoterWeight(publicKey, vsrClient, connectionContext)
  }
  return (
    <div>
      <h3>
        Looks like currently connected wallet doesnt have any MNGO deposited
        inside realms
      </h3>
      <div>
        In order to create proposals here or inside realms please go to
        https://dao.mango.markets/ and deposit minimum 100k MNGO
      </div>
      <div>
        deposit will be blocked only for the voting period of proposal after the
        proposal ends you can always withdraw tokens back to wallet
      </div>
      <div>
        <Button onClick={refetchVoterWeight}>Tokens Deposited</Button>
      </div>
    </div>
  )
}

export default OnBoarding
