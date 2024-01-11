import { useMemo, useState } from 'react'
import {
  CheckIcon,
  DocumentDuplicateIcon,
  HeartIcon,
  PlusCircleIcon,
  UserPlusIcon,
} from '@heroicons/react/20/solid'
import {
  HealthType,
  MangoAccount,
  toUiDecimalsForQuote,
} from '@blockworks-foundation/mango-v4'
import mangoStore from '@store/mangoStore'
import { IconButton, LinkButton } from '../shared/Button'
import useLocalStorageState from '../../hooks/useLocalStorageState'
import { LAST_ACCOUNT_KEY } from '../../utils/constants'
import { useTranslation } from 'next-i18next'
import { retryFn } from '../../utils'
import Loading from '../shared/Loading'
import Modal from '@components/shared/Modal'
import CreateAccountForm from '@components/account/CreateAccountForm'
import { EnterRightExitLeft } from '@components/shared/Transitions'
import { useRouter } from 'next/router'
import useMangoAccount from 'hooks/useMangoAccount'
import useMangoGroup from 'hooks/useMangoGroup'
import { notify } from 'utils/notifications'
import { DEFAULT_DELEGATE } from './DelegateModal'
import Tooltip from '@components/shared/Tooltip'
import { abbreviateAddress } from 'utils/formatting'
import { handleCopyAddress } from '@components/account/AccountActions'
import useUnownedAccount from 'hooks/useUnownedAccount'
import { floorToDecimal, numberCompacter } from 'utils/numbers'

const MangoAccountsListModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) => {
  const { t } = useTranslation('common')
  const { isDelegatedAccount } = useUnownedAccount()
  const { mangoAccount, initialLoad: loading } = useMangoAccount()
  const mangoAccounts = mangoStore((s) => s.mangoAccounts)
  const actions = mangoStore.getState().actions
  const { group } = useMangoGroup()
  const [showNewAccountForm, setShowNewAccountForm] = useState(false)
  const [, setLastAccountViewed] = useLocalStorageState(LAST_ACCOUNT_KEY)
  const router = useRouter()
  const { asPath } = useRouter()
  const [submitting, setSubmitting] = useState('')

  const sortedMangoAccounts = useMemo(() => {
    if (!group) return mangoAccounts

    return [...mangoAccounts].sort((a, b) => {
      // keeps the current selected mango account at the top of the list
      // if (b.publicKey.toString() === mangoAccount?.publicKey.toString())
      //   return 1
      // if (a.publicKey.toString() === mangoAccount?.publicKey.toString())
      //   return -1
      return b.getEquity(group).toNumber() - a.getEquity(group).toNumber()
    })
  }, [group, mangoAccounts])

  const handleSelectMangoAccount = async (acc: MangoAccount) => {
    const set = mangoStore.getState().set
    const client = mangoStore.getState().client
    if (!group) return
    set((s) => {
      s.activityFeed.feed = []
      s.activityFeed.loading = true
    })
    setSubmitting(acc.publicKey.toString())
    try {
      const reloadedMangoAccount = await retryFn(() => acc.reload(client))
      set((s) => {
        s.mangoAccount.current = reloadedMangoAccount
      })
      actions.fetchOpenOrders()
      setLastAccountViewed(acc.publicKey.toString())
    } catch (e) {
      console.warn('Error selecting account', e)
      notify({
        type: 'info',
        title: 'Unable to load account. Please try again.',
        description: `${e}`,
      })
    } finally {
      onClose()
      setSubmitting('')
    }
  }

  const handleClose = () => {
    if (asPath !== '/') {
      router.push('/')
    }
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="inline-block w-full transform overflow-x-hidden">
        <div className="flex min-h-[462px] flex-col justify-between">
          <div>
            <h2 className="text-center">{t('accounts')}</h2>
            {loading ? (
              <Loading />
            ) : mangoAccounts.length ? (
              <div className="thin-scroll mt-4 max-h-[374px] space-y-2 overflow-y-auto">
                {sortedMangoAccounts.map((acc) => {
                  if (
                    mangoAccount &&
                    acc.publicKey.equals(mangoAccount.publicKey)
                  ) {
                    acc = mangoAccount
                  }
                  const accountValue = floorToDecimal(
                    toUiDecimalsForQuote(Number(acc.getEquity(group!))),
                    2,
                  )
                  const maintHealth = acc.getHealthRatioUi(
                    group!,
                    HealthType.maint,
                  )
                  return (
                    <div
                      className="flex h-16 w-full items-center text-th-fgd-1"
                      key={acc.publicKey.toString()}
                    >
                      <button
                        onClick={() => handleSelectMangoAccount(acc)}
                        className="flex h-full w-full items-center justify-between rounded-md rounded-r-none border border-th-bkg-4 px-4 text-th-fgd-1 focus-visible:border-th-fgd-4 md:hover:border-th-fgd-4"
                      >
                        <div className="flex w-full items-center justify-between">
                          <div className="flex items-center space-x-2.5">
                            {submitting === acc.publicKey.toString() ? (
                              <Loading className="h-4 w-4" />
                            ) : acc.publicKey.toString() ===
                              mangoAccount?.publicKey.toString() ? (
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-th-success">
                                <CheckIcon className="h-4 w-4 text-th-bkg-1" />
                              </div>
                            ) : (
                              <div className="h-5 w-5 rounded-full bg-th-bkg-4" />
                            )}
                            <div className="div flex items-center text-left">
                              {acc.delegate.toString() !== DEFAULT_DELEGATE ? (
                                <div className="mr-2">
                                  <Tooltip
                                    content={t('delegate-account-info', {
                                      delegate: isDelegatedAccount
                                        ? t('you')
                                        : abbreviateAddress(acc.delegate),
                                    })}
                                  >
                                    <UserPlusIcon className="ml-1.5 h-4 w-4 text-th-fgd-3" />
                                  </Tooltip>
                                </div>
                              ) : null}
                              <div className="mb-0.5">
                                <div className="flex items-center">
                                  {acc.name ? (
                                    <p className="mr-2 text-sm font-bold text-th-fgd-1">
                                      {acc.name}
                                    </p>
                                  ) : null}
                                </div>
                                <p className="text-xs text-th-fgd-3">
                                  {abbreviateAddress(acc.publicKey)}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex font-mono">
                            <span className="text-th-fgd-2">
                              ${numberCompacter.format(accountValue.toNumber())}
                            </span>
                            <span className="mx-2 text-th-fgd-4">|</span>
                            <div
                              className={`flex items-center ${
                                maintHealth
                                  ? maintHealth > 15 && maintHealth < 50
                                    ? 'text-th-warning'
                                    : maintHealth >= 50
                                    ? 'text-th-success'
                                    : 'text-th-error'
                                  : 'text-th-fgd-4'
                              }`}
                            >
                              <HeartIcon className="mr-1 h-4 w-4 shrink-0" />
                              <span>{maintHealth}%</span>
                            </div>
                          </div>
                        </div>
                      </button>
                      <div className="flex h-full items-center justify-center rounded-md rounded-l-none border border-l-0 border-th-bkg-4">
                        <Tooltip
                          className="hidden md:block"
                          content={t('copy-address')}
                          delay={100}
                        >
                          <IconButton
                            className="text-th-fgd-3"
                            onClick={() =>
                              handleCopyAddress(
                                acc.publicKey.toString(),
                                t('copy-address-success', {
                                  pk: abbreviateAddress(acc.publicKey),
                                }),
                              )
                            }
                            hideBg
                            size="medium"
                          >
                            <DocumentDuplicateIcon className="h-5 w-5" />
                          </IconButton>
                        </Tooltip>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex h-48 flex-col items-center justify-center">
                <span className="mb-1 text-2xl">😎</span>
                <p className="text-center text-sm">Create your first account</p>
              </div>
            )}
          </div>
          <div className="pt-6">
            <LinkButton
              className="w-full justify-center"
              onClick={() => setShowNewAccountForm(true)}
            >
              <PlusCircleIcon className="h-5 w-5" />
              <span className="ml-2">{t('add-new-account')}</span>
            </LinkButton>
          </div>
          <EnterRightExitLeft
            className="absolute bottom-0 left-0 z-20 h-full w-full overflow-hidden bg-th-bkg-1"
            show={showNewAccountForm}
          >
            <CreateAccountForm
              customClose={handleClose}
              handleBack={() => setShowNewAccountForm(false)}
            />
          </EnterRightExitLeft>
        </div>
      </div>
    </Modal>
  )
}

export default MangoAccountsListModal
