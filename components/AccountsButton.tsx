import { UserPlusIcon } from '@heroicons/react/20/solid'
import useMangoAccount from 'hooks/useMangoAccount'
import { useTranslation } from 'next-i18next'
import { useCallback, useState } from 'react'
import { abbreviateAddress } from 'utils/formatting'
import CreateAccountModal from './modals/CreateAccountModal'
import { DEFAULT_DELEGATE } from './modals/DelegateModal'
import MangoAccountsListModal from './modals/MangoAccountsListModal'
import SheenLoader from './shared/SheenLoader'
import Tooltip from './shared/Tooltip'
import useUnownedAccount from 'hooks/useUnownedAccount'

const AccountsButton = () => {
  const { t } = useTranslation('common')
  const { mangoAccount, initialLoad } = useMangoAccount()
  const { isDelegatedAccount } = useUnownedAccount()
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false)
  const [showMangoAccountsModal, setShowMangoAccountsModal] = useState(false)

  const handleShowAccounts = useCallback(() => {
    if (mangoAccount) {
      setShowMangoAccountsModal(true)
    } else {
      setShowCreateAccountModal(true)
    }
  }, [mangoAccount])
  return (
    <>
      <button
        className="hidden h-16 border-l border-th-bkg-3 px-4 focus-visible:bg-th-bkg-3 md:block md:hover:bg-th-bkg-2"
        id="account-step-two"
        onClick={handleShowAccounts}
      >
        <p className="text-right text-xs">{t('accounts')}</p>
        <div className="text-left text-sm font-bold text-th-fgd-1">
          {mangoAccount ? (
            <div className="flex items-center">
              {mangoAccount.name}
              {mangoAccount.delegate.toString() !== DEFAULT_DELEGATE ? (
                <Tooltip
                  content={t('delegate-account-info', {
                    delegate: isDelegatedAccount
                      ? t('you')
                      : abbreviateAddress(mangoAccount.delegate),
                  })}
                >
                  <UserPlusIcon className="ml-1.5 h-4 w-4 text-th-fgd-3" />
                </Tooltip>
              ) : null}
            </div>
          ) : initialLoad ? (
            <SheenLoader className="mt-1">
              <div className="h-4 w-24 bg-th-bkg-2" />
            </SheenLoader>
          ) : (
            <span>
              <span className="mr-1.5">🥭</span>
              {t('create-account')}
            </span>
          )}
        </div>
      </button>
      {showMangoAccountsModal ? (
        <MangoAccountsListModal
          isOpen={showMangoAccountsModal}
          onClose={() => setShowMangoAccountsModal(false)}
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

export default AccountsButton
