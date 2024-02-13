import { Bank } from '@blockworks-foundation/mango-v4'
import DepositWithdrawModal from '@components/modals/DepositWithdrawModal'
import Button, { LinkButton } from '@components/shared/Button'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import Modal from '@components/shared/Modal'
import Tooltip from '@components/shared/Tooltip'
import UnsettledTrades from '@components/trade/UnsettledTrades'
import { ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/20/solid'
import mangoStore from '@store/mangoStore'
import useAccountInterest from 'hooks/useAccountInterest'
import useHealthContributions from 'hooks/useHealthContributions'
import useMangoAccount from 'hooks/useMangoAccount'
import useUnsettledPerpPositions from 'hooks/useUnsettledPerpPositions'
import { useTranslation } from 'next-i18next'
import { useMemo, useState } from 'react'
import { ModalProps } from 'types/modal'
import { formatCurrencyValue } from 'utils/numbers'

const ActionPanel = ({ bank }: { bank: Bank }) => {
  const { t } = useTranslation(['common', 'trade'])
  const { mangoAccount } = useMangoAccount()
  const { initContributions } = useHealthContributions()
  const [showDepositModal, setShowDepositModal] = useState<
    'deposit' | 'withdraw' | ''
  >('')
  const [showSettleModal, setShowSettleModal] = useState(false)
  const { data: totalInterestData } = useAccountInterest()
  const [depositRate, borrowRate] = useMemo(() => {
    const depositRate = bank.getDepositRateUi()
    const borrowRate = bank.getBorrowRateUi()
    return [depositRate, borrowRate]
  }, [bank])

  const collateralValue =
    initContributions.find((val) => val.asset === bank.name)?.contribution || 0
  const spotBalances = mangoStore((s) => s.mangoAccount.spotBalances)
  const inOrders = spotBalances[bank.mint.toString()]?.inOrders || 0
  let unsettled = spotBalances[bank.mint.toString()]?.unsettled || 0
  const unsettledPerpPositions = useUnsettledPerpPositions()

  if (bank.name === 'USDC' && unsettledPerpPositions?.length) {
    const group = mangoStore.getState().group
    const unsettledPositionValues = []
    for (const position of unsettledPerpPositions) {
      const market = group?.getPerpMarketByMarketIndex(position.marketIndex)
      if (market) {
        const posUnsettled = position.getUnsettledPnlUi(market)
        unsettledPositionValues.push(posUnsettled)
      }
    }
    unsettled = unsettled + unsettledPositionValues.reduce((a, c) => a + c, 0)
  }

  const symbol = bank.name === 'MSOL' ? 'mSOL' : bank.name
  const hasInterestEarned = totalInterestData?.find(
    (d) =>
      d.symbol.toLowerCase() === symbol.toLowerCase() ||
      (symbol === 'ETH (Portal)' && d.symbol === 'ETH'),
  )

  const interestAmount = hasInterestEarned
    ? hasInterestEarned.borrow_interest * -1 +
      hasInterestEarned.deposit_interest
    : 0

  const interestValue = hasInterestEarned
    ? hasInterestEarned.borrow_interest_usd * -1 +
      hasInterestEarned.deposit_interest_usd
    : 0

  return (
    <>
      <div className="h-full w-full bg-th-bkg-2 p-4 md:p-6">
        <h2 className="mb-4 text-lg">Your {bank?.name}</h2>
        <div className="border-b border-th-bkg-4">
          <div className="flex justify-between border-t border-th-bkg-4 py-3">
            <p>{t('balance')}</p>
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
          <div className="flex justify-between border-t border-th-bkg-4 py-3">
            <p>{t('collateral-value')}</p>
            <p className="font-mono text-th-fgd-2">
              {mangoAccount ? formatCurrencyValue(collateralValue) : '$0.00'}
            </p>
          </div>
          <div className="flex justify-between border-t border-th-bkg-4 py-3">
            <p>{t('trade:in-orders')}</p>
            <p className="font-mono text-th-fgd-2">
              {inOrders ? (
                <FormatNumericValue
                  value={inOrders}
                  decimals={bank.mintDecimals}
                />
              ) : (
                0
              )}
            </p>
          </div>
          <div className="flex justify-between border-t border-th-bkg-4 py-3">
            <p>{t('trade:unsettled')}</p>
            {unsettled ? (
              <div className="flex space-x-2">
                <p className="font-mono text-th-fgd-2">
                  <FormatNumericValue
                    value={unsettled}
                    decimals={bank.mintDecimals}
                  />
                </p>
                <LinkButton onClick={() => setShowSettleModal(true)}>
                  {t('trade:settle')}
                </LinkButton>
              </div>
            ) : (
              <p className="font-mono text-th-fgd-2">0</p>
            )}
          </div>
          <div className="flex justify-between border-t border-th-bkg-4 py-3">
            <p>{t('interest-earned')}</p>
            <div>
              <p className="text-right font-mono text-th-fgd-2">
                {interestAmount ? (
                  <FormatNumericValue
                    value={interestAmount}
                    decimals={bank.mintDecimals}
                  />
                ) : (
                  0
                )}
              </p>
              <p className="text-right font-mono text-xs text-th-fgd-3">
                $
                {interestValue ? (
                  <FormatNumericValue value={interestValue} decimals={2} />
                ) : (
                  0
                )}
              </p>
            </div>
          </div>
          <div className="flex justify-between border-t border-th-bkg-4 py-3">
            <p>{t('rates')}</p>
            <div className="flex justify-end space-x-1.5">
              <Tooltip content={t('deposit-rate')}>
                <p className="cursor-help font-mono text-th-up">
                  <FormatNumericValue value={depositRate} decimals={2} />%
                </p>
              </Tooltip>
              <span className="text-th-fgd-4">|</span>
              <Tooltip content={t('borrow-rate')}>
                <p className="cursor-help font-mono text-th-down">
                  <FormatNumericValue value={borrowRate} decimals={2} />%
                </p>
              </Tooltip>
            </div>
          </div>
        </div>
        <div className="flex space-x-4 pt-8">
          <Button
            className="flex-1"
            secondary
            disabled={!mangoAccount}
            onClick={() => setShowDepositModal('deposit')}
          >
            <div className="flex items-center space-x-2">
              <ArrowDownTrayIcon className="h-5 w-5" />
              <span>{t('deposit')}</span>
            </div>
          </Button>
          <Button
            className="flex-1"
            secondary
            disabled={!mangoAccount}
            onClick={() => setShowDepositModal('withdraw')}
          >
            <div className="flex items-center space-x-2">
              <ArrowUpTrayIcon className="h-5 w-5" />
              <span>{t('withdraw')}</span>
            </div>
          </Button>
        </div>
      </div>
      {showDepositModal ? (
        <DepositWithdrawModal
          action={showDepositModal}
          isOpen={!!showDepositModal}
          onClose={() => setShowDepositModal('')}
          token={bank?.name}
        />
      ) : null}
      {showSettleModal ? (
        <UnsettledModal
          isOpen={showSettleModal}
          onClose={() => setShowSettleModal(false)}
        />
      ) : null}
    </>
  )
}

export default ActionPanel

const UnsettledModal = ({ isOpen, onClose }: ModalProps) => {
  const { t } = useTranslation('trade')
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="mb-4 text-center md:mb-0">{t('unsettled-balances')}</h2>
      <div className="border-t border-th-bkg-3 md:border-t-0">
        <UnsettledTrades />
      </div>
    </Modal>
  )
}
