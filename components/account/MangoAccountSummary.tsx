import mangoStore from '../../store/state'
import { toUiDecimals, HealthType } from '@blockworks-foundation/mango-v4'
import { formatDecimal } from '../../utils/numbers'
import Button from '../shared/Button'
import { useState } from 'react'
import DepositModal from '../modals/DepositModal'
import WithdrawModal from '../modals/WithdrawModal'
import { useTranslation } from 'next-i18next'

const MangoAccountSummary = () => {
  const { t } = useTranslation('common')
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)

  return (
    <>
      <div className="mb-4 space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-th-fgd-3">Account Value</p>
          <p className="font-bold text-th-fgd-1">
            $
            {mangoAccount
              ? formatDecimal(
                  toUiDecimals(mangoAccount.getEquity().toNumber()),
                  2
                )
              : (0).toFixed(2)}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-th-fgd-3">Free Collateral</p>
          <p className="font-bold text-th-fgd-1">
            $
            {mangoAccount
              ? formatDecimal(
                  toUiDecimals(mangoAccount.getCollateralValue().toNumber()),
                  2
                )
              : (0).toFixed(2)}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-th-fgd-3">Health</p>
          <p className="font-bold text-th-fgd-1">
            {mangoAccount
              ? mangoAccount.getHealthRatio(HealthType.init).toNumber()
              : 100}
            %
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          className="w-1/2 pl-3 pr-3"
          onClick={() => setShowDepositModal(true)}
        >
          {t('deposit')}
        </Button>
        <Button
          className="w-1/2 pl-3 pr-3"
          onClick={() => setShowWithdrawModal(true)}
          secondary
        >
          {t('withdraw')}
        </Button>
      </div>
      {showDepositModal ? (
        <DepositModal
          isOpen={showDepositModal}
          onClose={() => setShowDepositModal(false)}
        />
      ) : null}
      {showWithdrawModal ? (
        <WithdrawModal
          isOpen={showWithdrawModal}
          onClose={() => setShowWithdrawModal(false)}
        />
      ) : null}
    </>
  )
}

export default MangoAccountSummary
