import Select from '@components/forms/Select'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import GovernanceStore from '@store/governanceStore'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { useEffect } from 'react'
import { abbreviateAddress } from 'utils/formatting'
import { GOVERNANCE_DELEGATE_KEY } from 'utils/governance/constants'
import { useTranslation } from 'next-i18next'

const GovernanceDelegate = () => {
  const { t } = useTranslation('governance')
  const { publicKey } = useWallet()
  const delegates = GovernanceStore((s) => s.delegates)
  const [selectedDelegatePk, setSelectedDelegatePk] = useLocalStorageState(
    `${publicKey?.toBase58()}${GOVERNANCE_DELEGATE_KEY}`
  )
  const connectionContext = GovernanceStore((s) => s.connectionContext)
  const vsrClient = GovernanceStore((s) => s.vsrClient)
  const getCurrentVotingPower = GovernanceStore((s) => s.getCurrentVotingPower)
  const voter = GovernanceStore((s) => s.voter.tokenOwnerRecord)
  const currentDelegate = delegates
    .find((x) => x.pubkey.toBase58() === selectedDelegatePk)
    ?.account.governingTokenOwner.toBase58()

  useEffect(() => {
    if (
      publicKey?.toBase58() &&
      connectionContext?.endpoint &&
      vsrClient?.program.programId.toBase58() &&
      voter
    ) {
      getCurrentVotingPower(publicKey, vsrClient, connectionContext)
    }
  }, [selectedDelegatePk])

  return (
    <div>
      <p>{t('select-delegate')}</p>
      <Select
        value={
          currentDelegate
            ? abbreviateAddress(new PublicKey(currentDelegate))
            : t('use-own-wallet')
        }
        onChange={(selected) => {
          setSelectedDelegatePk(selected)
        }}
        className="w-full"
      >
        <Select.Option value={''}>
          <div className="flex w-full items-center justify-between">
            {t('use-own-wallet')}
          </div>
        </Select.Option>
        {delegates.map((x) => (
          <Select.Option key={x.pubkey.toBase58()} value={x.pubkey.toBase58()}>
            <div className="flex w-full items-center justify-between">
              {abbreviateAddress(x.account.governingTokenOwner)}
            </div>
          </Select.Option>
        ))}
      </Select>
    </div>
  )
}

export default GovernanceDelegate
