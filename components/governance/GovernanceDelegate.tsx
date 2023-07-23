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
  const connectionContext = GovernanceStore((s) => s.connectionContext)
  const vsrClient = GovernanceStore((s) => s.vsrClient)
  const getCurrentVotingPower = GovernanceStore((s) => s.getCurrentVotingPower)

  const [selectedDelegatePk, setSelectedDelegatePk] = useLocalStorageState(
    `${publicKey?.toBase58()}${GOVERNANCE_DELEGATE_KEY}`,
  )
  const currentDelegate = delegates
    .find((x) => x.pubkey.toBase58() === selectedDelegatePk)
    ?.account.governingTokenOwner.toBase58()

  useEffect(() => {
    if (
      publicKey?.toBase58() &&
      connectionContext?.endpoint &&
      vsrClient?.program.programId.toBase58()
    ) {
      getCurrentVotingPower(publicKey, vsrClient, connectionContext)
    }
  }, [selectedDelegatePk])

  return delegates.length ? (
    <div className="flex items-center">
      <p className="mr-2">{t('delegate')}</p>
      <Select
        value={
          currentDelegate
            ? abbreviateAddress(new PublicKey(currentDelegate))
            : t('none')
        }
        onChange={(selected) => {
          setSelectedDelegatePk(selected)
        }}
        className="w-full"
      >
        <Select.Option value={''}>
          <div className="flex w-full items-center justify-between">
            {t('none')}
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
  ) : null
}

export default GovernanceDelegate
