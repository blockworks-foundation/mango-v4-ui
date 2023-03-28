import Loading from '@components/shared/Loading'
import { useWallet } from '@solana/wallet-adapter-react'
import GovernanceStore from '@store/governanceStore'
import mangoStore from '@store/mangoStore'
import BN from 'bn.js'
import { useTranslation } from 'next-i18next'
import { ReactNode, useEffect } from 'react'
import { MANGO_DAO_WALLET_GOVERNANCE } from 'utils/governance/constants'
import OnBoarding from './OnBoarding'

const OnBoardingWrapper = ({ children }: { children: ReactNode }) => {
  const { connected, publicKey } = useWallet()
  const {
    initConnection,
    connectionContext,
    initRealm,
    vsrClient,
    loadingRealm,
    loadingVoter,
    fetchVoterWeight,
    voter,
    realm,
    governances,
  } = GovernanceStore()
  const { connection } = mangoStore()
  const { t } = useTranslation(['governance'])

  useEffect(() => {
    initConnection(connection)
    console.log('init connection')
  }, [connection.rpcEndpoint])
  useEffect(() => {
    if (connectionContext && connected) {
      initRealm(connectionContext)
      console.log('init realm')
    }
  }, [connectionContext?.endpoint, connected, realm === null])
  useEffect(() => {
    if (publicKey && connectionContext && vsrClient) {
      fetchVoterWeight(publicKey, vsrClient, connectionContext)
      console.log('fetch voter weight')
    }
  }, [
    publicKey?.toBase58(),
    connectionContext?.endpoint,
    vsrClient?.program.programId.toBase58(),
  ])
  const minVoterWeight = governances
    ? governances[MANGO_DAO_WALLET_GOVERNANCE.toBase58()].account.config
        .minCommunityTokensToCreateProposal
    : new BN(0)

  const Wrapper = () => {
    if (loadingRealm || loadingVoter) {
      return <Loading className="mr-2 h-5 w-5" />
    }
    if (connected) {
      if (voter.voteWeight.cmp(minVoterWeight) === -1) {
        return <OnBoarding></OnBoarding>
      } else {
        return null
      }
    } else {
      return <div>{t('connect-wallet')}</div>
    }
  }
  return Wrapper() ? Wrapper() : <div>{children}</div>
}
export default OnBoardingWrapper
