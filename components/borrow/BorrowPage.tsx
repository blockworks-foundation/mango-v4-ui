import { INITIAL_ANIMATION_SETTINGS } from '@components/settings/AnimationSettings'
import useLocalStorageState from 'hooks/useLocalStorageState'
import useMangoAccount from 'hooks/useMangoAccount'
import useMangoGroup from 'hooks/useMangoGroup'
import { useTranslation } from 'next-i18next'
import { ANIMATION_SETTINGS_KEY, USDC_MINT } from 'utils/constants'
import FlipNumbers from 'react-flip-numbers'
import Button from '@components/shared/Button'
import { formatCurrencyValue } from 'utils/numbers'
import { useEffect, useMemo, useState } from 'react'
import YourBorrowsTable from './YourBorrowsTable'
import AssetsBorrowsTable from './AssetsBorrowsTable'
import { ArrowDownRightIcon, ArrowUpLeftIcon } from '@heroicons/react/20/solid'
import { useWallet } from '@solana/wallet-adapter-react'
import BorrowRepayModal from '@components/modals/BorrowRepayModal'
import CreateAccountModal from '@components/modals/CreateAccountModal'
import TabButtons from '@components/shared/TabButtons'
import { useViewport } from 'hooks/useViewport'
import { breakpoints } from 'utils/theme'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import useBanksWithBalances from 'hooks/useBanksWithBalances'
import { PublicKey } from '@solana/web3.js'
import { getMaxWithdrawForBank } from '@components/swap/useTokenMax'

const BorrowPage = () => {
  const { t } = useTranslation(['common', 'borrow'])
  const { group } = useMangoGroup()
  const { mangoAccount, mangoAccountAddress } = useMangoAccount()
  const [activeTab, setActiveTab] = useState('borrow:your-borrows')
  const [showBorrowModal, setShowBorrowModal] = useState(false)
  const [showRepayModal, setShowRepayModal] = useState(false)
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false)
  const { connected } = useWallet()
  const { width } = useViewport()
  const fullWidthTabs = width ? width < breakpoints.sm : false
  const banks = useBanksWithBalances()

  const handleBorrowModal = () => {
    if (!connected || mangoAccount) {
      setShowBorrowModal(true)
    } else {
      setShowCreateAccountModal(true)
    }
  }
  const [animationSettings] = useLocalStorageState(
    ANIMATION_SETTINGS_KEY,
    INITIAL_ANIMATION_SETTINGS,
  )

  const filteredBanks = useMemo(() => {
    if (banks.length) {
      return banks.filter((b) => b.borrowedAmount > 0)
    }
    return []
  }, [banks])

  const borrowValue = useMemo(() => {
    if (!filteredBanks.length) return 0
    return filteredBanks.reduce(
      (a, c) => a + Math.abs(c.borrowedAmount) * c.bank.uiPrice,
      0,
    )
  }, [filteredBanks])

  useEffect(() => {
    if (mangoAccountAddress && !borrowValue) {
      setActiveTab('borrow:assets-to-borrow')
    }
  }, [borrowValue, mangoAccountAddress])

  const [collateralRemaining, collateralRemainingRatio] = useMemo(() => {
    if (mangoAccount && group) {
      const usdcBank = group.getFirstBankByMint(new PublicKey(USDC_MINT))
      const remaining = getMaxWithdrawForBank(
        group,
        usdcBank,
        mangoAccount,
        true,
      ).toNumber()

      if (borrowValue) {
        const total = borrowValue + remaining
        const ratio = (remaining / total) * 100
        return [remaining, ratio]
      }
      return [remaining, 100]
    }
    return [0, 0]
  }, [borrowValue, mangoAccount, group])

  return (
    <div className="min-h-[calc(100vh-146px)]">
      <div className="flex flex-col border-b border-th-bkg-3 px-4 py-4 md:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col md:flex-row">
          <div className="pb-4 md:pb-0 md:pr-6">
            <p className="mb-0.5 text-base">
              {t('borrow:current-borrow-value')}
            </p>
            <div className="flex items-center font-display text-5xl text-th-fgd-1">
              {animationSettings['number-scroll'] ? (
                group && mangoAccount ? (
                  <FlipNumbers
                    height={48}
                    width={35}
                    play
                    delay={0.05}
                    duration={1}
                    numbers={formatCurrencyValue(borrowValue, 2)}
                  />
                ) : (
                  <FlipNumbers
                    height={48}
                    width={36}
                    play
                    delay={0.05}
                    duration={1}
                    numbers={'$0.00'}
                  />
                )
              ) : (
                <FormatNumericValue value={borrowValue} decimals={2} isUsd />
              )}
            </div>
          </div>
          <div className="h-full border-t border-th-bkg-3 pt-4 md:border-b-0 md:border-l md:border-t-0 md:pl-6 md:pt-0">
            <p className="mb-0.5 text-base">
              {t('borrow:available-to-borrow')}
            </p>
            <p className="mb-1 font-display text-2xl text-th-fgd-2">
              <FormatNumericValue
                value={collateralRemaining}
                decimals={2}
                isUsd
              />
            </p>
            <div className="mt-[2px] flex h-2 w-full rounded-full bg-th-bkg-3 md:w-48">
              <div
                style={{
                  width: `${collateralRemainingRatio}%`,
                }}
                className="flex rounded-full bg-th-active"
              ></div>
            </div>
          </div>
        </div>
        <div className="mb-1 mt-6 lg:mb-0 lg:mt-0">
          <div className="flex items-center space-x-2">
            <Button
              className="flex w-1/2 items-center justify-center md:w-auto"
              disabled={!mangoAccount}
              onClick={() => setShowRepayModal(true)}
              secondary
            >
              <ArrowDownRightIcon className="mr-2 h-5 w-5" />
              {t('repay')}
            </Button>
            <Button
              className="flex w-1/2 items-center justify-center md:w-auto"
              onClick={handleBorrowModal}
              secondary
            >
              <ArrowUpLeftIcon className="mr-2 h-5 w-5" />
              {t('borrow')}
            </Button>
          </div>
        </div>
      </div>
      <div className="border-b border-th-bkg-3">
        <TabButtons
          activeValue={activeTab}
          fillWidth={fullWidthTabs}
          onChange={(v) => setActiveTab(v)}
          showBorders
          values={[
            ['borrow:your-borrows', 0],
            ['borrow:assets-to-borrow', 0],
          ]}
        />
      </div>
      {activeTab === 'borrow:your-borrows' ? (
        <YourBorrowsTable banks={filteredBanks} />
      ) : (
        <AssetsBorrowsTable />
      )}
      {showBorrowModal ? (
        <BorrowRepayModal
          action="borrow"
          isOpen={showBorrowModal}
          onClose={() => setShowBorrowModal(false)}
        />
      ) : null}
      {showRepayModal ? (
        <BorrowRepayModal
          action="repay"
          isOpen={showRepayModal}
          onClose={() => setShowRepayModal(false)}
        />
      ) : null}
      {showCreateAccountModal ? (
        <CreateAccountModal
          isOpen={showCreateAccountModal}
          onClose={() => setShowCreateAccountModal(false)}
        />
      ) : null}
    </div>
  )
}

export default BorrowPage
