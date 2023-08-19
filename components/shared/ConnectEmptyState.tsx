import WalletIcon from '@components/icons/WalletIcon'
import SecondaryConnectButton from './SecondaryConnectButton'

const ConnectEmptyState = ({ text }: { text: string }) => {
  return (
    <div className="flex flex-col items-center">
      <WalletIcon className="mb-2 h-6 w-6 text-th-fgd-4" />
      <p className="mb-4">{text}</p>
      <SecondaryConnectButton />
    </div>
  )
}

export default ConnectEmptyState
