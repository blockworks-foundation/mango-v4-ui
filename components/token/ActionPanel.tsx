import { Bank } from '@blockworks-foundation/mango-v4'
import BorrowRepayModal from '@components/modals/BorrowRepayModal'
import DepositWithdrawModal from '@components/modals/DepositWithdrawModal'
import Button from '@components/shared/Button'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import mangoStore from '@store/mangoStore'
import useMangoAccount from 'hooks/useMangoAccount'
import useMangoGroup from 'hooks/useMangoGroup'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'

const ActionPanel = ({ bank }: { bank: Bank }) => {
  const { t } = useTranslation('common')
  const { group } = useMangoGroup()
  const { mangoAccount } = useMangoAccount()
  const router = useRouter()
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showBorrowModal, setShowBorrowModal] = useState(false)

  const serumMarkets = useMemo(() => {
    if (group) {
      return Array.from(group.serum3MarketsMapByExternal.values())
    }
    return []
  }, [group])

  const handleTrade = () => {
    const set = mangoStore.getState().set
    const market = serumMarkets.find(
      (m) => m.baseTokenIndex === bank?.tokenIndex,
    )
    if (market) {
      set((state) => {
        state.selectedMarket.current = market
      })
      router.push('/trade')
    }
  }

  return (
    <>
      <div className="w-full rounded-md bg-th-bkg-2 p-4 md:w-[343px]">
        <div className="mb-4 flex justify-between">
          <p>
            {bank.name} {t('balance')}:
          </p>
          <p className="font-mono text-th-fgd-2">
            {mangoAccount ? (
              <FormatNumericValue
                value={mangoAccount.getTokenBalanceUi(bank)}
                decimals={bank.mintDecimals}
              />
            ) : (
              0
            )}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            className="flex-1"
            size="small"
            disabled={!mangoAccount}
            onClick={() => setShowDepositModal(true)}
          >
            {t('deposit')}
          </Button>
          <Button
            className="flex-1"
            size="small"
            secondary
            disabled={!mangoAccount}
            onClick={() => setShowBorrowModal(true)}
          >
            {t('borrow')}
          </Button>
          <Button
            className="flex-1"
            size="small"
            secondary
            disabled={
              !mangoAccount ||
              !serumMarkets.find((m) => m.baseTokenIndex === bank?.tokenIndex)
            }
            onClick={handleTrade}
          >
            {t('trade')}
          </Button>
        </div>
      </div>
      {showDepositModal ? (
        <DepositWithdrawModal
          action="deposit"
          isOpen={showDepositModal}
          onClose={() => setShowDepositModal(false)}
          token={bank!.name}
        />
      ) : null}
      {showBorrowModal ? (
        <BorrowRepayModal
          action="borrow"
          isOpen={showBorrowModal}
          onClose={() => setShowBorrowModal(false)}
          token={bank!.name}
        />
      ) : null}
    </>
  )
}

export default ActionPanel
