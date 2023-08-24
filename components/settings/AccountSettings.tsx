import MangoAccountSizeModal from '@components/modals/MangoAccountSizeModal'
import ActionsLinkButton from '@components/account/ActionsLinkButton'
import { LinkButton } from '@components/shared/Button'
import TokenLogo from '@components/shared/TokenLogo'
import Tooltip from '@components/shared/Tooltip'
import MarketLogos from '@components/trade/MarketLogos'
import { Disclosure, Popover, Transition } from '@headlessui/react'
import {
  ChevronDownIcon,
  MinusCircleIcon,
  SquaresPlusIcon,
} from '@heroicons/react/20/solid'
import { PublicKey, TransactionInstruction } from '@solana/web3.js'
import mangoStore from '@store/mangoStore'
import useMangoAccount from 'hooks/useMangoAccount'
import useMangoAccountAccounts, {
  getAvaialableAccountsColor,
} from 'hooks/useMangoAccountAccounts'
import useMangoGroup from 'hooks/useMangoGroup'
import { useTranslation } from 'next-i18next'
import { Fragment, useState } from 'react'
import { MAX_ACCOUNTS } from 'utils/constants'
import { isMangoError } from 'types'
import { notify } from 'utils/notifications'

enum CLOSE_TYPE {
  TOKEN,
  PERP,
  SERUMOO,
  PERPOO,
}

const AccountSettings = () => {
  const { t } = useTranslation(['common', 'settings'])
  const { mangoAccountAddress, mangoAccount } = useMangoAccount()
  const { group } = useMangoGroup()
  const [showAccountSizeModal, setShowAccountSizeModal] = useState(false)
  const {
    usedTokens,
    usedSerum3,
    usedPerps,
    usedPerpOo,
    // emptyTokens,
    emptySerum3,
    emptyPerps,
    // emptyPerpOo,
    totalTokens,
    totalSerum3,
    totalPerps,
    totalPerpOpenOrders,
    isAccountFull,
  } = useMangoAccountAccounts()

  const handleCloseSlots = async (closeType: CLOSE_TYPE) => {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const actions = mangoStore.getState().actions
    if (!mangoAccount || !group) return
    try {
      let ixs: TransactionInstruction[] = []
      if (closeType == CLOSE_TYPE.TOKEN) {
        // No instruction yet
      } else if (closeType === CLOSE_TYPE.PERP) {
        ixs = await Promise.all(
          emptyPerps.map((p) =>
            client.perpDeactivatePositionIx(group, mangoAccount, p.marketIndex),
          ),
        )
      } else if (closeType === CLOSE_TYPE.SERUMOO) {
        ixs = await Promise.all(
          emptySerum3.map((s) =>
            client.serum3CloseOpenOrdersIx(
              group,
              mangoAccount,
              new PublicKey(s),
            ),
          ),
        )
      } else if (closeType === CLOSE_TYPE.PERPOO) {
        // No instruction yet
      }

      if (ixs.length === 0) return
      const tx = await client.sendAndConfirmTransaction(ixs)

      notify({
        title: 'Transaction confirmed',
        type: 'success',
        txid: tx.signature,
      })
      await actions.reloadMangoAccount()
    } catch (e) {
      console.error(e)
      if (!isMangoError(e)) return
      notify({
        title: 'Transaction failed',
        description: e.message,
        txid: e?.txid,
        type: 'error',
      })
    }
  }

  return mangoAccountAddress && group ? (
    <>
      <h2 className="mb-4 text-base">{t('account')}</h2>
      <div className="mb-4 flex items-center justify-between md:px-4">
        <h3 className="text-sm text-th-fgd-2">{t('settings:account-size')}</h3>
        {!isAccountFull ? (
          <LinkButton
            className="flex items-center"
            onClick={() => setShowAccountSizeModal(true)}
          >
            <SquaresPlusIcon className="mr-1.5 h-4 w-4" />
            {t('settings:increase-account-size')}
          </LinkButton>
        ) : null}
        {emptySerum3.length > 0 || emptyPerps.length > 0 ? (
          <Popover className="relative sm:w-1/3 md:w-auto">
            {({ open }) => (
              <>
                <Popover.Button
                  className={`w-full focus:outline-none`}
                  as="div"
                >
                  <LinkButton className="flex items-center">
                    <MinusCircleIcon className="mr-1.5 h-4 w-4" />
                    {t('settings:close-unused-slots')}
                  </LinkButton>
                </Popover.Button>
                <Transition
                  appear={true}
                  show={open}
                  as={Fragment}
                  enter="transition ease-in duration-75"
                  enterFrom="opacity-0 nice scale-75"
                  enterTo="opacity-100 scale-100"
                  leave="transition ease-out duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Popover.Panel className="absolute right-0 top-10 mt-1 space-y-2 rounded-md bg-th-bkg-2 px-4 py-2.5">
                    {/* <ActionsLinkButton
                      disabled={emptyTokens.length === 0}
                      mangoAccount={mangoAccount!}
                      onClick={() => console.log('handle close tokens')}
                    >
                      <span className="ml-2">{'Close unused token positions'}</span>
                    </ActionsLinkButton> */}
                    <ActionsLinkButton
                      disabled={emptySerum3.length === 0}
                      mangoAccount={mangoAccount!}
                      onClick={() => handleCloseSlots(CLOSE_TYPE.SERUMOO)}
                    >
                      <span className="ml-2">
                        {t('settings:close-spot-oo')}
                      </span>
                    </ActionsLinkButton>
                    <ActionsLinkButton
                      disabled={emptyPerps.length === 0}
                      mangoAccount={mangoAccount!}
                      onClick={() => handleCloseSlots(CLOSE_TYPE.PERP)}
                    >
                      <span className="ml-2">{t('settings:close-perp')}</span>
                    </ActionsLinkButton>
                    {/* <ActionsLinkButton
                      disabled={emptyPerpOo.length === 0}
                      mangoAccount={mangoAccount!}
                      onClick={() => console.log('close perp oos')}
                    >
                      <span className="ml-2">{'Close unused perp OOs'}</span>
                    </ActionsLinkButton> */}
                  </Popover.Panel>
                </Transition>
              </>
            )}
          </Popover>
        ) : null}
      </div>
      <Disclosure>
        {({ open }) => (
          <>
            <Disclosure.Button className="w-full border-t border-th-bkg-3 py-4 md:px-4">
              <div className="flex items-center justify-between">
                <Tooltip
                  content={t('settings:tooltip-token-accounts', {
                    max: MAX_ACCOUNTS.tokenAccounts,
                  })}
                >
                  <p className="tooltip-underline">{t('tokens')}</p>
                </Tooltip>
                <div className="flex items-center space-x-2">
                  <p className="font-mono">
                    <span
                      className={getAvaialableAccountsColor(
                        usedTokens.length,
                        totalTokens.length,
                      )}
                    >{`${usedTokens.length}/${totalTokens.length}`}</span>
                  </p>
                  <ChevronDownIcon
                    className={`${
                      open ? 'rotate-180' : 'rotate-360'
                    } h-6 w-6 flex-shrink-0 text-th-fgd-3`}
                  />
                </div>
              </div>
            </Disclosure.Button>
            <Disclosure.Panel className="pb-2 md:px-4">
              {usedTokens.length ? (
                usedTokens.map((token, i) => {
                  const tokenBank = group.getFirstBankByTokenIndex(
                    token.tokenIndex,
                  )
                  return (
                    <div
                      className="mb-2 flex items-center"
                      key={token.tokenIndex}
                    >
                      <p className="mr-3 text-th-fgd-4">{i + 1}.</p>
                      <TokenLogo bank={tokenBank} size={20} />
                      <p className="ml-2 text-th-fgd-2">{tokenBank.name}</p>
                    </div>
                  )
                })
              ) : (
                <p className="mb-2 text-center">
                  {t('notifications:empty-state-title')}...
                </p>
              )}
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
      <Disclosure>
        {({ open }) => (
          <>
            <Disclosure.Button className="w-full border-t border-th-bkg-3 py-4 md:px-4">
              <div className="flex items-center justify-between">
                <Tooltip
                  content={t('settings:tooltip-spot-open-orders', {
                    max: MAX_ACCOUNTS.spotOpenOrders,
                  })}
                >
                  <p className="tooltip-underline mb-2 md:mb-0">
                    {t('settings:spot-open-orders')}
                  </p>
                </Tooltip>
                <div className="flex items-center space-x-2">
                  <p className="font-mono">
                    <span
                      className={getAvaialableAccountsColor(
                        usedSerum3.length,
                        totalSerum3.length,
                      )}
                      key="spotOpenOrders"
                    >{`${usedSerum3.length}/${totalSerum3.length}`}</span>
                  </p>
                  <ChevronDownIcon
                    className={`${
                      open ? 'rotate-180' : 'rotate-360'
                    } h-6 w-6 flex-shrink-0 text-th-fgd-3`}
                  />
                </div>
              </div>
            </Disclosure.Button>
            <Disclosure.Panel className="pb-2 md:px-4">
              {usedSerum3.length ? (
                usedSerum3.map((mkt, i) => {
                  const market = group.getSerum3MarketByMarketIndex(
                    mkt.marketIndex,
                  )
                  return (
                    <div
                      className="mb-2 flex items-center"
                      key={mkt.marketIndex}
                    >
                      <p className="mr-3 text-th-fgd-4">{i + 1}.</p>
                      <MarketLogos market={market} />
                      <p className="text-th-fgd-2">{market.name}</p>
                    </div>
                  )
                })
              ) : (
                <p className="mb-2 text-center">
                  {t('notifications:empty-state-title')}...
                </p>
              )}
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
      <Disclosure>
        {({ open }) => (
          <>
            <Disclosure.Button className="w-full border-t border-th-bkg-3 py-4 md:px-4">
              <div className="flex items-center justify-between">
                <Tooltip
                  content={t('settings:tooltip-perp-positions', {
                    max: MAX_ACCOUNTS.perpAccounts,
                  })}
                >
                  <p className="tooltip-underline mb-2 md:mb-0">
                    {t('settings:perp-positions')}
                  </p>
                </Tooltip>
                <div className="flex items-center space-x-2">
                  <p className="font-mono">
                    <span
                      className={getAvaialableAccountsColor(
                        usedPerps.length,
                        totalPerps.length,
                      )}
                    >{`${usedPerps.length}/${totalPerps.length}`}</span>
                  </p>
                  <ChevronDownIcon
                    className={`${
                      open ? 'rotate-180' : 'rotate-360'
                    } h-6 w-6 flex-shrink-0 text-th-fgd-3`}
                  />
                </div>
              </div>
            </Disclosure.Button>
            <Disclosure.Panel className="pb-2 md:px-4">
              {usedPerps.length ? (
                usedPerps.map((perp, i) => {
                  const market = group.getPerpMarketByMarketIndex(
                    perp.marketIndex,
                  )
                  return (
                    <div
                      className="mb-2 flex items-center"
                      key={perp.marketIndex}
                    >
                      <p className="mr-3 text-th-fgd-4">{i + 1}.</p>
                      <MarketLogos market={market} />
                      <p className="text-th-fgd-2">{market.name}</p>
                    </div>
                  )
                })
              ) : (
                <p className="mb-2 text-center">
                  {t('notifications:empty-state-title')}...
                </p>
              )}
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
      <Disclosure>
        {({ open }) => (
          <>
            <Disclosure.Button className="w-full border-t border-th-bkg-3 py-4 md:px-4">
              <div className="flex items-center justify-between">
                <Tooltip
                  content={t('settings:tooltip-perp-open-orders', {
                    max: MAX_ACCOUNTS.perpOpenOrders,
                  })}
                >
                  <p className="tooltip-underline mb-2 md:mb-0">
                    {t('settings:perp-open-orders')}
                  </p>
                </Tooltip>
                <div className="flex items-center space-x-2">
                  <p className="font-mono">
                    <span
                      className={getAvaialableAccountsColor(
                        usedPerpOo.length,
                        totalPerpOpenOrders.length,
                      )}
                    >{`${usedPerpOo.length}/${totalPerpOpenOrders.length}`}</span>
                  </p>
                  <ChevronDownIcon
                    className={`${
                      open ? 'rotate-180' : 'rotate-360'
                    } h-6 w-6 flex-shrink-0 text-th-fgd-3`}
                  />
                </div>
              </div>
            </Disclosure.Button>
            <Disclosure.Panel className="pb-2 md:px-4">
              {usedPerpOo.length ? (
                usedPerpOo.map((perp, i) => {
                  const market = group.getPerpMarketByMarketIndex(
                    perp.orderMarket,
                  )
                  return (
                    <div
                      className="mb-2 flex items-center"
                      key={perp.orderMarket}
                    >
                      <p className="mr-3 text-th-fgd-4">{i + 1}.</p>
                      <MarketLogos market={market} />
                      <p className="text-th-fgd-2">{market.name}</p>
                    </div>
                  )
                })
              ) : (
                <p className="mb-2 text-center">
                  {t('notifications:empty-state-title')}...
                </p>
              )}
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
      {/* 
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
      </div> */}
      {showAccountSizeModal ? (
        <MangoAccountSizeModal
          isOpen={showAccountSizeModal}
          onClose={() => setShowAccountSizeModal(false)}
        />
      ) : null}
    </>
  ) : null
}

export default AccountSettings
