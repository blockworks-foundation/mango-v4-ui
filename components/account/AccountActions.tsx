import { useWallet } from '@solana/wallet-adapter-react'
import { Fragment, useState } from 'react'
import Button, { LinkButton } from '../shared/Button'
import DepositModal from '../modals/DepositModal'
import WithdrawModal from '../modals/WithdrawModal'
import mangoStore from '../../store/state'
import { Popover, Transition } from '@headlessui/react'
import { DotsHorizontalIcon, TrashIcon, XIcon } from '@heroicons/react/solid'
import { useTranslation } from 'next-i18next'

const AccountActions = () => {
  const { t } = useTranslation(['common', 'close-account'])
  const { connected } = useWallet()
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)

  const handleCloseMangoAccount = async () => {
    const client = mangoStore.getState().client
    const mangoAccount = mangoStore.getState().mangoAccount
    const group = mangoStore.getState().group
    if (!mangoAccount || !group) return
    try {
      const tx = await client.closeMangoAccount(group, mangoAccount)
      console.log('success:', tx)
    } catch (e) {
      console.log(e)
    }
  }

  return (
    <>
      <div className="flex space-x-3">
        <Button
          disabled={!connected}
          onClick={() => setShowDepositModal(true)}
          size="large"
        >
          {t('deposit')}
        </Button>
        <Button
          disabled={!connected}
          onClick={() => setShowWithdrawModal(true)}
          secondary
          size="large"
        >
          {t('withdraw')}
        </Button>
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
                  <LinkButton
                    className="flex items-center whitespace-nowrap"
                    disabled={!connected}
                    onClick={handleCloseMangoAccount}
                  >
                    <TrashIcon className="mr-2 h-5 w-5" />
                    {t('close-account')}
                  </LinkButton>
                </Popover.Panel>
              </Transition>
            </div>
          )}
        </Popover>
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

export default AccountActions
