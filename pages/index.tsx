import { toUiDecimals } from '@blockworks-foundation/mango-v4'
import { Popover, Transition } from '@headlessui/react'
import { DotsHorizontalIcon, XIcon } from '@heroicons/react/solid'
import type { NextPage } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { Fragment, useState } from 'react'
import DepositModal from '../components/modals/DepositModal'
import WithdrawModal from '../components/modals/WithdrawModal'
import Button from '../components/shared/Button'
import mangoStore from '../store/state'
import { formatDecimal } from '../utils/numbers'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  }
}

const Index: NextPage = () => {
  const { t } = useTranslation('common')
  const mangoAccount = mangoStore((s) => s.mangoAccount)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  return (
    <>
      <div className="flex items-end justify-between">
        <div>
          <p className="mb-1">{t('account-value')}</p>
          <div className="text-5xl font-bold text-th-fgd-1">
            $
            {mangoAccount
              ? formatDecimal(
                  toUiDecimals(mangoAccount.getEquity().toNumber()),
                  2
                )
              : (0).toFixed(2)}
          </div>
        </div>
        <div className="flex space-x-3">
          <Button>{t('deposit')}</Button>
          <Button secondary>{t('withdraw')}</Button>
          <Popover>
            {({ open }) => (
              <div className="relative">
                <Popover.Button className="flex h-12 w-12 items-center justify-center rounded-full border border-th-fgd-4 hover:text-th-primary">
                  {open ? (
                    <XIcon className="h-5 w-5" />
                  ) : (
                    <DotsHorizontalIcon className="h-5 w-5" />
                  )}
                </Popover.Button>
                <Transition
                  appear={true}
                  show={open}
                  as={Fragment}
                  enter="transition-all ease-in duration-300"
                  enterFrom="opacity-0 transform scale-90"
                  enterTo="opacity-100 transform scale-100"
                  leave="transition ease-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Popover.Panel
                    className={`absolute right-0 top-14 z-20 space-y-2 rounded-md border border-th-bkg-3 bg-th-bkg-2 p-4`}
                  >
                    Stuff...
                  </Popover.Panel>
                </Transition>
              </div>
            )}
          </Popover>
        </div>
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

export default Index
