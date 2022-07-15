require('@solana/wallet-adapter-react-ui/styles.css')
import SideNav from './SideNav'
import { ReactNode, useEffect, useState } from 'react'
import { ArrowRightIcon, ChevronRightIcon } from '@heroicons/react/solid'
import { useWallet } from '@solana/wallet-adapter-react'
import { useViewport } from '../../hooks/useViewport'
import { breakpoints } from '../../utils/theme'
import {
  WalletDisconnectButton,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui'
import { useTranslation } from 'next-i18next'

const Layout = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation('common')
  const { connected } = useWallet()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { width } = useViewport()

  useEffect(() => {
    const collapsed = width ? width < breakpoints.lg : false
    setIsCollapsed(collapsed)
  }, [])

  const handleToggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'))
    }, 100)
  }

  return (
    <div className={`flex-grow bg-th-bkg-1 text-th-fgd-1 transition-all`}>
      <div className="flex">
        <div
          className={
            isCollapsed ? 'mr-14' : 'mr-[220px] lg:mr-[250px] xl:mr-[280px]'
          }
        >
          <div className={`fixed z-20 h-screen`}>
            <button
              className="absolute -right-4 top-1/2 z-20 h-10 w-4 -translate-y-1/2 transform rounded-none rounded-r bg-th-bkg-4 focus:outline-none"
              onClick={handleToggleSidebar}
            >
              <ChevronRightIcon
                className={`default-transition h-full w-full ${
                  !isCollapsed ? 'rotate-180' : 'rotate-360'
                }`}
              />
            </button>
            <div className={`h-full ${!isCollapsed ? 'overflow-y-auto' : ''}`}>
              <SideNav collapsed={isCollapsed} />
            </div>
          </div>
        </div>
        <div className="w-full overflow-hidden">
          <div className="flex h-14 items-center justify-between border-b border-th-bkg-3 bg-th-bkg-1 px-6">
            <div className="flex items-center text-th-fgd-3">
              <span className="mb-0 mr-2">
                {connected ? (
                  <span>
                    🟢<span className="ml-2">Mango Account Name</span>
                  </span>
                ) : (
                  <span className="flex items-center">
                    🔗<span className="ml-2">{t('connect-helper')}</span>
                    <ArrowRightIcon className="sideways-bounce ml-2 h-5 w-5 text-th-fgd-1" />
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {connected ? <WalletDisconnectButton /> : <WalletMultiButton />}
            </div>
          </div>
          <div className="min-h-screen px-6 pb-16 md:pb-6">{children}</div>
        </div>
      </div>
    </div>
  )
}

export default Layout
