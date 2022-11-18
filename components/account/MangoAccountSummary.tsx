import mangoStore from '@store/mangoStore'
import {
  HealthType,
  toUiDecimalsForQuote,
} from '@blockworks-foundation/mango-v4'
import { formatDecimal, formatFixedDecimals } from '../../utils/numbers'
import Button from '../shared/Button'
import { useMemo, useState } from 'react'
import DepositModal from '../modals/DepositModal'
import WithdrawModal from '../modals/WithdrawModal'
import { useTranslation } from 'next-i18next'
import { ArrowDownTrayIcon } from '@heroicons/react/20/solid'
import { useWallet } from '@solana/wallet-adapter-react'
import useMangoAccount from 'hooks/useMangoAccount'

const MangoAccountSummary = () => {
  const { t } = useTranslation('common')
  const { connected } = useWallet()
  const group = mangoStore.getState().group
  const { mangoAccount } = useMangoAccount()
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)

  const leverage = useMemo(() => {
    if (!group || !mangoAccount) return 0
    const liabsValue = mangoAccount
      .getLiabsValue(group, HealthType.init)!
      .toNumber()
    const totalCollateral = mangoAccount
      .getAssetsValue(group, HealthType.init)!
      .toNumber()
    if (isNaN(liabsValue / totalCollateral)) {
      return 0
    } else return liabsValue / totalCollateral
  }, [mangoAccount])

  return (
    <>
      <div className="mb-4 space-y-2">
        <div>
          <p className="text-sm text-th-fgd-3">{t('health')}</p>
          <p className="font-mono text-sm text-th-fgd-1">
            {group && mangoAccount
              ? mangoAccount.getHealthRatioUi(group, HealthType.maint)
              : 0}
            %
          </p>
        </div>
        <div>
          <p className="text-sm text-th-fgd-3">{t('account-value')}</p>
          <p className="font-mono text-sm text-th-fgd-1">
            $
            {group && mangoAccount
              ? formatDecimal(
                  toUiDecimalsForQuote(
                    mangoAccount.getEquity(group)!.toNumber()
                  ),
                  2
                )
              : (0).toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-sm text-th-fgd-3">{t('free-collateral')}</p>
          <p className="font-mono text-sm text-th-fgd-1">
            {group && mangoAccount
              ? formatFixedDecimals(
                  toUiDecimalsForQuote(
                    mangoAccount.getCollateralValue(group)!.toNumber()
                  ),
                  true
                )
              : `$${(0).toFixed(2)}`}
          </p>
        </div>
        <div>
          <p className="text-sm text-th-fgd-3">{t('total-collateral')}</p>
          <p className="font-mono text-sm text-th-fgd-1">
            {group && mangoAccount
              ? formatFixedDecimals(
                  toUiDecimalsForQuote(
                    mangoAccount
                      .getAssetsValue(group, HealthType.init)!
                      .toNumber()
                  ),
                  true
                )
              : `$${(0).toFixed(2)}`}
          </p>
        </div>
        <div>
          <p className="text-sm text-th-fgd-3">{t('leverage')}</p>
          <p className="font-mono text-sm text-th-fgd-1">
            {leverage.toFixed(2)}x
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <Button
          className="flex w-full items-center justify-center"
          disabled={!mangoAccount || !connected}
          onClick={() => setShowDepositModal(true)}
        >
          <ArrowDownTrayIcon className="mr-2 h-5 w-5" />
          {t('deposit')}
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
