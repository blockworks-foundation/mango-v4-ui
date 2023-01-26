import { INITIAL_ANIMATION_SETTINGS } from '@components/settings/AnimationSettings'
import Tooltip from '@components/shared/Tooltip'
import useLocalStorageState from 'hooks/useLocalStorageState'
import useMangoAccount from 'hooks/useMangoAccount'
import useMangoGroup from 'hooks/useMangoGroup'
import { useTranslation } from 'next-i18next'
import { ANIMATION_SETTINGS_KEY } from 'utils/constants'
import FlipNumbers from 'react-flip-numbers'
import Button from '@components/shared/Button'
import mangoStore from '@store/mangoStore'
import { formatFixedDecimals } from 'utils/numbers'
import { useEffect, useMemo, useState } from 'react'
import YourBorrowsTable from './YourBorrowsTable'
import AssetsBorrowsTable from './AssetsBorrowsTable'
import { ArrowDownRightIcon, ArrowUpLeftIcon } from '@heroicons/react/20/solid'
import { useWallet } from '@solana/wallet-adapter-react'
import BorrowRepayModal from '@components/modals/BorrowRepayModal'
import CreateAccountModal from '@components/modals/CreateAccountModal'
import { toUiDecimalsForQuote } from '@blockworks-foundation/mango-v4'
import TabButtons from '@components/shared/TabButtons'

const BorrowPage = () => {
  const { t } = useTranslation(['common', 'borrow'])
  const { group } = useMangoGroup()
  const { mangoAccount, mangoAccountAddress } = useMangoAccount()
  const [activeTab, setActiveTab] = useState('borrow:your-borrows')
  const [showBorrowModal, setShowBorrowModal] = useState(false)
  const [showRepayModal, setShowRepayModal] = useState(false)
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false)
  const { connected } = useWallet()

  const handleBorrowModal = () => {
    if (!connected || mangoAccount) {
      setShowBorrowModal(true)
    } else {
      setShowCreateAccountModal(true)
    }
  }
  const [animationSettings] = useLocalStorageState(
    ANIMATION_SETTINGS_KEY,
    INITIAL_ANIMATION_SETTINGS
  )
  const actions = mangoStore((s) => s.actions)

  useEffect(() => {
    if (mangoAccountAddress) {
      const set = mangoStore.getState().set
      set((s) => {
        s.mangoAccount.performance.initialLoad = false
      })
      actions.fetchAccountPerformance(mangoAccountAddress, 1)
    }
  }, [actions, mangoAccountAddress])

  const banks = useMemo(() => {
    if (group && mangoAccount) {
      const borrowBanks = Array.from(group?.banksMapByName, ([key, value]) => ({
        key,
        value,
      })).filter((b) => {
        const bank = b.value[0]
        return mangoAccount.getTokenBalanceUi(bank) < 0
      })
      return borrowBanks
        .map((b) => {
          return {
            balance: mangoAccount.getTokenBalanceUi(b.value[0]),
            bank: b.value[0],
          }
        })
        .sort((a, b) => {
          const aBalance = Math.abs(a.balance * a.bank.uiPrice)
          const bBalance = Math.abs(b.balance * b.bank.uiPrice)
          return aBalance > bBalance ? -1 : 1
        })
    }
    return []
  }, [group, mangoAccount])

  useEffect(() => {
    if (mangoAccountAddress && !banks.length) {
      setActiveTab('borrow:assets-to-borrow')
    }
  }, [banks, mangoAccountAddress])

  const borrowValue = useMemo(() => {
    if (!banks.length) return 0
    return banks.reduce((a, c) => a + Math.abs(c.balance) * c.bank.uiPrice, 0)
  }, [banks])

  const [collateralRemaining, collateralRemainingRatio] = useMemo(() => {
    if (mangoAccount && group) {
      const remaining = toUiDecimalsForQuote(
        mangoAccount.getCollateralValue(group).toNumber()
      )
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
    <>
      <div className="flex flex-col border-b border-th-bkg-3 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col md:flex-row">
          <div className="pb-4 md:pr-6 md:pb-0">
            <Tooltip
              maxWidth="20rem"
              placement="bottom-start"
              content="The value of your assets (deposits) minus the value of your liabilities (borrows)."
              delay={250}
            >
              <p className="mb-0.5 text-base">
                {t('borrow:current-borrow-value')}
              </p>
            </Tooltip>
            <div className="flex items-center font-display text-5xl text-th-fgd-1">
              {animationSettings['number-scroll'] ? (
                group && mangoAccount ? (
                  <FlipNumbers
                    height={48}
                    width={35}
                    play
                    delay={0.05}
                    duration={1}
                    numbers={formatFixedDecimals(borrowValue, true, true)}
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
                <span>{formatFixedDecimals(borrowValue, true, true)}</span>
              )}
            </div>
          </div>
          <div className="h-full border-t border-th-bkg-3 pt-4 md:border-t-0 md:border-b-0 md:border-l md:pt-0 md:pl-6">
            <p className="mb-0.5 text-base">
              {t('borrow:available-to-borrow')}
            </p>
            <p className="mb-1 font-display text-2xl text-th-fgd-2">
              {formatFixedDecimals(collateralRemaining, true, true)}
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
        <div className="mt-6 mb-1 lg:mt-0 lg:mb-0">
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
          onChange={(v) => setActiveTab(v)}
          showBorders
          values={[
            ['borrow:your-borrows', 0],
            ['borrow:assets-to-borrow', 0],
          ]}
        />
      </div>
      {activeTab === 'borrow:your-borrows' ? (
        <YourBorrowsTable banks={banks} />
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
    </>
  )
}

export default BorrowPage
