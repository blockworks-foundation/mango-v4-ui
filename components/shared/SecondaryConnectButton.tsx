import { useTranslation } from 'react-i18next'
import Button from './Button'
import { useWallet } from '@solana/wallet-adapter-react'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { WalletName, WalletReadyState } from '@solana/wallet-adapter-base'
import { AUTO_CONNECT_WALLET, LAST_WALLET_NAME } from 'utils/constants'
import { notify } from 'utils/notifications'
import { LinkIcon } from '@heroicons/react/20/solid'
import mangoStore from '@store/mangoStore'
import { useCallback } from 'react'

const set = mangoStore.getState().set

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
  const [autoConnect] = useLocalStorageState(AUTO_CONNECT_WALLET, true)

  const handleConnect = useCallback(() => {
    if (!autoConnect) {
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
  }, [autoConnect, lastWalletName, select, wallets])

  return (
    <Button
      className={className}
      onClick={handleConnect}
      size={isLarge ? 'large' : 'medium'}
    >
      <div className="flex items-center">
        <LinkIcon className="mr-2 h-5 w-5" />
        {t('connect')}
      </div>
    </Button>
  )
}

export default SecondaryConnectButton
