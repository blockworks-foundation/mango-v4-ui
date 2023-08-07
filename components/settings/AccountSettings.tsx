import MangoAccountSizeModal, {
  MAX_ACCOUNTS,
} from '@components/modals/MangoAccountSizeModal'
import { LinkButton } from '@components/shared/Button'
import Tooltip from '@components/shared/Tooltip'
import { SquaresPlusIcon } from '@heroicons/react/20/solid'
import mangoStore from '@store/mangoStore'
import useMangoAccount from 'hooks/useMangoAccount'
import { useTranslation } from 'next-i18next'
import { useMemo, useState } from 'react'

// todo: use these functions to auto show model when an account is full
export const getUsedMangoAccountAccounts = (
  mangoAccountAddress: string | undefined,
) => {
  const mangoAccount = mangoStore.getState().mangoAccount.current
  if (!mangoAccountAddress || !mangoAccount) return [0, 0, 0, 0]
  const { tokens, serum3, perps, perpOpenOrders } = mangoAccount
  const usedTokens = tokens.filter((t) => t.inUseCount).length
  const usedSerum3 = serum3.filter((s) => s.marketIndex !== 65535).length
  const usedPerps = perps.filter((p) => p.marketIndex !== 65535).length
  const usedPerpOo = perpOpenOrders.filter(
    (p) => p.orderMarket !== 65535,
  ).length
  return [usedTokens, usedSerum3, usedPerps, usedPerpOo]
}

export const getTotalMangoAccountAccounts = (
  mangoAccountAddress: string | undefined,
) => {
  const mangoAccount = mangoStore.getState().mangoAccount.current
  if (!mangoAccountAddress || !mangoAccount) return [0, 0, 0, 0]
  const { tokens, serum3, perps, perpOpenOrders } = mangoAccount
  const totalTokens = tokens.length
  const totalSerum3 = serum3.length
  const totalPerps = perps.length
  const totalPerpOpenOrders = perpOpenOrders.length
  return [totalTokens, totalSerum3, totalPerps, totalPerpOpenOrders]
}

export const getAvaialableAccountsColor = (used: number, total: number) => {
  const remaining = total - used
  return remaining >= 4
    ? 'text-th-up'
    : remaining >= 2
    ? 'text-th-warning'
    : 'text-th-down'
}

const AccountSettings = () => {
  const { t } = useTranslation(['common', 'settings'])
  const { mangoAccountAddress } = useMangoAccount()
  const [showAccountSizeModal, setShowAccountSizeModal] = useState(false)

  const [availableTokens, availableSerum3, availablePerps, availablePerpOo] =
    useMemo(() => {
      const [usedTokens, usedSerum3, usedPerps, usedPerpOo] =
        getUsedMangoAccountAccounts(mangoAccountAddress)
      const [totalTokens, totalSerum3, totalPerps, totalPerpOpenOrders] =
        getTotalMangoAccountAccounts(mangoAccountAddress)
      return [
        <span
          className={getAvaialableAccountsColor(usedTokens, totalTokens)}
          key="tokenAccounts"
        >{`${usedTokens}/${totalTokens}`}</span>,
        <span
          className={getAvaialableAccountsColor(usedSerum3, totalSerum3)}
          key="spotOpenOrders"
        >{`${usedSerum3}/${totalSerum3}`}</span>,
        <span
          className={getAvaialableAccountsColor(usedPerps, totalPerps)}
          key="perpAccounts"
        >{`${usedPerps}/${totalPerps}`}</span>,
        <span
          className={getAvaialableAccountsColor(
            usedPerpOo,
            totalPerpOpenOrders,
          )}
          key="perpOpenOrders"
        >{`${usedPerpOo}/${totalPerpOpenOrders}`}</span>,
      ]
    }, [mangoAccountAddress])

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base">{t('account')}</h2>
        <LinkButton
          className="flex items-center"
          onClick={() => setShowAccountSizeModal(true)}
        >
          <SquaresPlusIcon className="h-4 w-4 mr-1.5" />
          {t('settings:increase-account-size')}
        </LinkButton>
      </div>
      <div className="flex flex-col border-t border-th-bkg-3 py-4 md:flex-row md:items-center md:justify-between md:px-4">
        <Tooltip
          content={t('settings:tooltip-token-accounts', {
            max: MAX_ACCOUNTS.tokenAccounts,
          })}
        >
          <p className="tooltip-underline mb-2 md:mb-0">{t('tokens')}</p>
        </Tooltip>
        <p className="font-mono text-th-fgd-2">{availableTokens}</p>
      </div>
      <div className="flex flex-col border-t border-th-bkg-3 py-4 md:flex-row md:items-center md:justify-between md:px-4">
        <Tooltip
          content={t('settings:tooltip-spot-open-orders', {
            max: MAX_ACCOUNTS.spotOpenOrders,
          })}
        >
          <p className="tooltip-underline mb-2 md:mb-0">
            {t('settings:spot-open-orders')}
          </p>
        </Tooltip>
        <p className="font-mono text-th-fgd-2">{availableSerum3}</p>
      </div>
      <div className="flex flex-col border-t border-th-bkg-3 py-4 md:flex-row md:items-center md:justify-between md:px-4">
        <Tooltip
          content={t('settings:tooltip-perp-positions', {
            max: MAX_ACCOUNTS.perpAccounts,
          })}
        >
          <p className="tooltip-underline mb-2 md:mb-0">
            {t('settings:perp-positions')}
          </p>
        </Tooltip>
        <p className="font-mono text-th-fgd-2">{availablePerps}</p>
      </div>
      <div className="flex flex-col border-t border-th-bkg-3 py-4 md:flex-row md:items-center md:justify-between md:px-4">
        <Tooltip
          content={t('settings:tooltip-perp-open-orders', {
            max: MAX_ACCOUNTS.perpOpenOrders,
          })}
        >
          <p className="tooltip-underline mb-2 md:mb-0">
            {t('settings:perp-open-orders')}
          </p>
        </Tooltip>
        <p className="font-mono text-th-fgd-2">{availablePerpOo}</p>
      </div>
      {showAccountSizeModal ? (
        <MangoAccountSizeModal
          isOpen={showAccountSizeModal}
          onClose={() => setShowAccountSizeModal(false)}
        />
      ) : null}
    </>
  )
}

export default AccountSettings
