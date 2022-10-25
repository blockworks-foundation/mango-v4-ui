import { useState } from 'react'
import { CheckIcon, HeartIcon, PlusCircleIcon } from '@heroicons/react/20/solid'
import {
  HealthType,
  MangoAccount,
  toUiDecimalsForQuote,
} from '@blockworks-foundation/mango-v4'
import mangoStore from '@store/mangoStore'
import { LinkButton } from '../shared/Button'
import { useLocalStorageStringState } from '../../hooks/useLocalStorageState'
import { LAST_ACCOUNT_KEY } from '../../utils/constants'
import { useTranslation } from 'next-i18next'
import { retryFn } from '../../utils'
import Loading from '../shared/Loading'
import Modal from '@components/shared/Modal'
import { formatFixedDecimals } from 'utils/numbers'
import CreateAccountForm from '@components/account/CreateAccountForm'
import { EnterRightExitLeft } from '@components/shared/Transitions'

const MangoAccountsListModal = ({
  // mangoAccount,
  isOpen,
  onClose,
}: {
  // mangoAccount: MangoAccount | undefined
  isOpen: boolean
  onClose: () => void
}) => {
  const { t } = useTranslation('common')
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)
  const mangoAccounts = mangoStore((s) => s.mangoAccounts)
  const actions = mangoStore((s) => s.actions)
  const group = mangoStore((s) => s.group)
  const loading = mangoStore((s) => s.mangoAccount.initialLoad)
  const [showNewAccountForm, setShowNewAccountForm] = useState(false)
  const [, setLastAccountViewed] = useLocalStorageStringState(LAST_ACCOUNT_KEY)

  const handleSelectMangoAccount = async (acc: MangoAccount) => {
    const set = mangoStore.getState().set
    const client = mangoStore.getState().client
    if (!group) return
    set((s) => {
      s.activityFeed.feed = []
      s.activityFeed.loading = true
    })
    try {
      const reloadedMangoAccount = await retryFn(() => acc.reload(client))
      set((s) => {
        s.mangoAccount.current = reloadedMangoAccount
        s.mangoAccount.lastUpdatedAt = new Date().toISOString()
      })
      setLastAccountViewed(acc.publicKey.toString())
      actions.fetchSerumOpenOrders(acc)
    } catch (e) {
      console.warn('Error selecting account', e)
    } finally {
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="inline-block w-full transform overflow-x-hidden">
        <div className="flex min-h-[264px] flex-col justify-between">
          <div>
            <h2 className="text-center">{t('accounts')}</h2>
            {loading ? (
              <Loading />
            ) : mangoAccounts.length ? (
              <div className="thin-scroll mt-4 max-h-[280px] space-y-2 overflow-y-auto">
                {mangoAccounts.map((acc) => {
                  const accountValue = formatFixedDecimals(
                    toUiDecimalsForQuote(Number(acc.getEquity(group!))),
                    true
                  )
                  const maintHealth = acc.getHealthRatioUi(
                    group!,
                    HealthType.maint
                  )
                  return (
                    <div key={acc.publicKey.toString()}>
                      <button
                        onClick={() => handleSelectMangoAccount(acc)}
                        className="default-transition flex w-full items-center justify-between rounded-md bg-th-bkg-2 p-4 text-th-fgd-1 hover:bg-th-bkg-3"
                      >
                        <div className="flex w-full items-center justify-between">
                          <div className="text-left">
                            <p className="mb-0.5 text-sm font-bold text-th-fgd-1">
                              {acc.name}
                            </p>
                            <div className="flex">
                              <span className="text-sm text-th-fgd-3">
                                {accountValue}
                              </span>
                              <span className="mx-2 text-th-fgd-4">|</span>
                              <div
                                className={`flex items-center ${
                                  maintHealth
                                    ? maintHealth > 15 && maintHealth < 50
                                      ? 'text-th-orange'
                                      : maintHealth >= 50
                                      ? 'text-th-green'
                                      : 'text-th-red'
                                    : 'text-th-fgd-4'
                                }`}
                              >
                                <HeartIcon className="mr-1 h-4 w-4" />
                                <span className="text-sm">{maintHealth}%</span>
                              </div>
                            </div>
                          </div>
                          {acc.publicKey.toString() ===
                          mangoAccount?.publicKey.toString() ? (
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-th-green">
                              <CheckIcon className="h-4 w-4 text-th-bkg-1" />
                            </div>
                          ) : (
                            <div className="h-5 w-5 rounded-full bg-th-bkg-4" />
                          )}
                        </div>
                      </button>
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
              <span className="ml-2">New Sub-account</span>
            </LinkButton>
          </div>
          <EnterRightExitLeft
            className="absolute bottom-0 left-0 z-20 h-full w-full overflow-hidden bg-th-bkg-1"
            show={showNewAccountForm}
          >
            <CreateAccountForm
              customClose={() => setShowNewAccountForm(false)}
              handleBack={() => setShowNewAccountForm(false)}
            />
          </EnterRightExitLeft>
        </div>
      </div>
    </Modal>
  )
}

export default MangoAccountsListModal
