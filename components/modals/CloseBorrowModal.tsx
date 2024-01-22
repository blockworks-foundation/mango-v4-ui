import { useState } from 'react'
import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import TabUnderline from '@components/shared/TabUnderline'
import MarketSwapForm from '@components/swap/MarketSwapForm'
import SwapFormTokenList, {
  SwapFormTokenListType,
} from '@components/swap/SwapFormTokenList'
import { EnterBottomExitBottom } from '@components/shared/Transitions'
import SwapSettings from '@components/swap/SwapSettings'
import {
  handleTokenInSelect,
  handleTokenOutSelect,
} from '@components/swap/SwapForm'
import mangoStore from '@store/mangoStore'
import SwapSummaryInfo from '@components/swap/SwapSummaryInfo'
import { Bank } from '@blockworks-foundation/mango-v4'
import RepayForm from '@components/RepayForm'
import { useTranslation } from 'react-i18next'
import TokenLogo from '@components/shared/TokenLogo'

interface CloseBorrowModalProps {
  borrowBank: Bank | undefined
}

type ModalCombinedProps = CloseBorrowModalProps & ModalProps

const TABS = ['swap', 'repay']

const CloseBorrowModal = ({
  borrowBank,
  isOpen,
  onClose,
}: ModalCombinedProps) => {
  const { t } = useTranslation('common')
  const [activeTab, setActiveTab] = useState(TABS[0])
  const [showSettings, setShowSettings] = useState(false)
  const [showTokenSelect, setShowTokenSelect] =
    useState<SwapFormTokenListType>()

  const { margin: useMargin } = mangoStore((s) => s.swap)

  return (
    <Modal isOpen={isOpen} onClose={onClose} panelClassNames="sm:py-2 sm:px-0">
      <div
        className={`relative h-[calc(100vh-16px)] ${
          activeTab === 'swap' ? 'sm:h-auto' : 'sm:h-[540px]'
        } sm:overflow-hidden`}
      >
        <div className="flex items-center justify-center space-x-2 sm:mt-2">
          <TokenLogo bank={borrowBank} />
          <h2 className="text-lg">
            {t('close-borrow', { token: borrowBank?.name })}
          </h2>
        </div>
        <div className="px-6 pb-2 md:pt-2.5">
          <TabUnderline
            activeValue={activeTab}
            values={TABS}
            onChange={(v) => setActiveTab(v)}
          />
        </div>
        {activeTab === 'swap' ? (
          <>
            <EnterBottomExitBottom
              className="thin-scroll absolute bottom-0 left-0 z-20 h-full w-full overflow-auto bg-th-bkg-1 p-6 pb-0"
              show={!!showTokenSelect}
            >
              <SwapFormTokenList
                onClose={() => setShowTokenSelect(undefined)}
                onTokenSelect={
                  showTokenSelect === 'input'
                    ? handleTokenInSelect
                    : handleTokenOutSelect
                }
                type={showTokenSelect}
                useMargin={useMargin}
              />
            </EnterBottomExitBottom>
            <EnterBottomExitBottom
              className="thin-scroll absolute bottom-0 left-0 z-10 h-full w-full overflow-auto bg-th-bkg-1 p-6 pb-0"
              show={showSettings}
            >
              <SwapSettings onClose={() => setShowSettings(false)} />
            </EnterBottomExitBottom>
            <div className="rounded-lg px-6 pb-4">
              <MarketSwapForm
                setShowTokenSelect={setShowTokenSelect}
                onSuccess={onClose}
              />
              <SwapSummaryInfo
                walletSwap={false}
                setShowSettings={setShowSettings}
              />
            </div>
          </>
        ) : (
          <div className="px-6">
            <RepayForm onSuccess={onClose} token={borrowBank?.name} />
          </div>
        )}
      </div>
    </Modal>
  )
}

export default CloseBorrowModal
