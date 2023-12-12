import { useTranslation } from 'react-i18next'
import Button from './Button'
import { useWallet } from '@solana/wallet-adapter-react'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { WalletName, WalletReadyState } from '@solana/wallet-adapter-base'
import { IS_ONBOARDED_KEY, LAST_WALLET_NAME } from 'utils/constants'
import { notify } from 'utils/notifications'
import mangoStore from '@store/mangoStore'
import { useCallback } from 'react'
import WalletIcon from '@components/icons/WalletIcon'

const SecondaryConnectButton = ({
  className,
  isLarge,
}: {
  className?: string
  isLarge?: boolean
}) => {
  const { t } = useTranslation('common')
  const { wallets, select } = useWallet()
  const [lastWalletName] = useLocalStorageState<WalletName | null>(
    LAST_WALLET_NAME,
    '',
  )
  const [isOnboarded] = useLocalStorageState(IS_ONBOARDED_KEY)

  const handleConnect = useCallback(() => {
    const set = mangoStore.getState().set
    if (!isOnboarded) {
      set((s) => {
        s.showUserSetup = true
      })
    } else if (lastWalletName) {
      select(lastWalletName)
    } else {
      const walletToConnect = wallets.find(
        (w) =>
          w.readyState === WalletReadyState.Installed ||
          w.readyState === WalletReadyState.Loadable,
      )
      if (walletToConnect) {
        select(walletToConnect.adapter.name)
      } else {
        notify({
          title: 'No wallet found. Install a Solana wallet and try again',
          type: 'error',
        })
      }
    }
  }, [isOnboarded, lastWalletName, select, wallets])

  return (
    <Button
      className={className}
      onClick={handleConnect}
      size={isLarge ? 'large' : 'medium'}
    >
      <div className="flex items-center">
        <WalletIcon className="mr-2 h-5 w-5" />
        {t('connect')}
      </div>
    </Button>
  )
}

export default SecondaryConnectButton
