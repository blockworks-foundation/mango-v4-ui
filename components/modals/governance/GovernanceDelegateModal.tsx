import Select from '@components/forms/Select'
import Modal from '@components/shared/Modal'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import GovernanceStore from '@store/governanceStore'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { abbreviateAddress } from 'utils/formatting'
import { GOVERNANCE_DELEGATE_KEY } from 'utils/governance/constants'
//import { useTranslation } from 'next-i18next'

type Props = {
  isOpen: boolean
  onClose: () => void
}

const GovernanceDelegateModal = ({ isOpen, onClose }: Props) => {
  //const { t } = useTranslation('governance')
  const { publicKey } = useWallet()
  const delegates = GovernanceStore((s) => s.delegates)
  const [selectedDelegatePk, setSelectedDelegatePk] = useLocalStorageState(
    `${publicKey?.toBase58()}${GOVERNANCE_DELEGATE_KEY}`
  )
  const currentDelegate = delegates
    .find((x) => x.pubkey.toBase58() === selectedDelegatePk)
    ?.account.governingTokenOwner.toBase58()

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div>
        <p>Select wallet</p>
        <Select
          value={
            currentDelegate
              ? abbreviateAddress(new PublicKey(currentDelegate))
              : 'Use own wallet'
          }
          onChange={(selected) => {
            setSelectedDelegatePk(selected)
          }}
          className="w-full"
        >
          <Select.Option value={''}>
            <div className="flex w-full items-center justify-between">
              Use own wallet
            </div>
          </Select.Option>
          {delegates.map((x) => (
            <Select.Option
              key={x.pubkey.toBase58()}
              value={x.pubkey.toBase58()}
            >
              <div className="flex w-full items-center justify-between">
                {abbreviateAddress(x.account.governingTokenOwner)}
              </div>
            </Select.Option>
          ))}
        </Select>
      </div>
    </Modal>
  )
}

export default GovernanceDelegateModal
