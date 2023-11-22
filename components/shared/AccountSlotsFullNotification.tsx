import Link from 'next/link'
import InlineNotification from './InlineNotification'
import { useTranslation } from 'react-i18next'
import TopBarStore from '@store/topBarStore'
import { useState } from 'react'
import CreateAccountModal from '@components/modals/CreateAccountModal'

const AccountSlotsFullNotification = ({ message }: { message: string }) => {
  const { t } = useTranslation('common')
  const { setShowSettingsModal } = TopBarStore()
  const [showCreateAccount, setShowCreateAccount] = useState(false)
  return (
    <>
      <InlineNotification
        type="error"
        desc={
          <>
            <span>{message}</span>
            <div className="mt-1 flex space-x-4">
              <Link href={''} onClick={() => setShowSettingsModal(true)}>
                {t('manage')}
              </Link>
              <Link href={''} onClick={() => setShowCreateAccount(true)}>
                {t('open-account')}
              </Link>
            </div>
          </>
        }
      />
      {showCreateAccount ? (
        <CreateAccountModal
          isOpen={showCreateAccount}
          onClose={() => setShowCreateAccount(false)}
        />
      ) : null}
    </>
  )
}

export default AccountSlotsFullNotification
