import { ReactNode, useMemo, useState } from 'react'
import Button, { LinkButton } from '../shared/Button'
import {
  ArrowDownRightIcon,
  ArrowUpLeftIcon,
  DocumentDuplicateIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/20/solid'
import { useTranslation } from 'next-i18next'
import IconDropMenu from '../shared/IconDropMenu'
import { copyToClipboard } from 'utils'
import { notify } from 'utils/notifications'
import { abbreviateAddress } from 'utils/formatting'
import {
  HealthType,
  MangoAccount,
  toUiDecimalsForQuote,
} from '@blockworks-foundation/mango-v4'
import useMangoAccount from 'hooks/useMangoAccount'
import useMangoGroup from 'hooks/useMangoGroup'
import BorrowRepayModal from '@components/modals/BorrowRepayModal'
import { useWallet } from '@solana/wallet-adapter-react'
import CreateAccountModal from '@components/modals/CreateAccountModal'

export const handleCopyAddress = (
  mangoAccount: MangoAccount,
  successMessage: string
) => {
  copyToClipboard(mangoAccount.publicKey.toString())
  notify({
    title: successMessage,
    type: 'success',
  })
}

const AccountActions = () => {
  const { t } = useTranslation(['common', 'close-account'])
  const { group } = useMangoGroup()
  const { mangoAccount } = useMangoAccount()
  const [showBorrowModal, setShowBorrowModal] = useState(false)
  const [showRepayModal, setShowRepayModal] = useState(false)
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false)
  const { connected } = useWallet()

  const hasBorrows = useMemo(() => {
    if (!mangoAccount || !group) return false
    return (
      toUiDecimalsForQuote(
        mangoAccount.getLiabsValue(group, HealthType.init).toNumber()
      ) >= 1
    )
  }, [mangoAccount, group])

  const handleBorrowModal = () => {
    if (!connected || mangoAccount) {
      setShowBorrowModal(true)
    } else {
      setShowCreateAccountModal(true)
    }
  }

  return (
    <>
      <div className="flex items-center space-x-2 md:space-x-3">
        {hasBorrows ? (
          <Button
            className="flex w-full items-center justify-center sm:w-auto"
            disabled={!mangoAccount}
            onClick={() => setShowRepayModal(true)}
          >
            <ArrowDownRightIcon className="mr-2 h-5 w-5" />
            {t('repay')}
          </Button>
        ) : null}
        <Button
          className="flex w-full items-center justify-center sm:w-auto"
          onClick={handleBorrowModal}
          secondary
        >
          <ArrowUpLeftIcon className="mr-2 h-5 w-5" />
          {t('borrow')}
        </Button>
        <IconDropMenu
          icon={<EllipsisHorizontalIcon className="h-5 w-5" />}
          size="medium"
        >
          <ActionsButton
            mangoAccount={mangoAccount!}
            onClick={() =>
              handleCopyAddress(
                mangoAccount!,
                t('copy-address-success', {
                  pk: abbreviateAddress(mangoAccount!.publicKey),
                })
              )
            }
          >
            <DocumentDuplicateIcon className="h-4 w-4" />
            <span className="ml-2">{t('copy-address')}</span>
          </ActionsButton>
        </IconDropMenu>
      </div>
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

export default AccountActions

const ActionsButton = ({
  children,
  mangoAccount,
  onClick,
}: {
  children: ReactNode
  mangoAccount: MangoAccount
  onClick: () => void
}) => {
  return (
    <LinkButton
      className="whitespace-nowrap font-normal no-underline md:hover:text-th-fgd-1"
      disabled={!mangoAccount}
      onClick={onClick}
    >
      {children}
    </LinkButton>
  )
}
