import MangoAccountSizeModal, {
  MAX_ACCOUNTS,
} from '@components/modals/MangoAccountSizeModal'
import { LinkButton } from '@components/shared/Button'
import TokenLogo from '@components/shared/TokenLogo'
import Tooltip from '@components/shared/Tooltip'
import MarketLogos from '@components/trade/MarketLogos'
import { Disclosure } from '@headlessui/react'
import {
  ChevronDownIcon,
  ExclamationCircleIcon,
  SquaresPlusIcon,
} from '@heroicons/react/20/solid'
import useMangoAccount from 'hooks/useMangoAccount'
import useMangoAccountAccounts, {
  getAvaialableAccountsColor,
} from 'hooks/useMangoAccountAccounts'
import useMangoGroup from 'hooks/useMangoGroup'
import { useTranslation } from 'next-i18next'
import { useState } from 'react'

const AccountSettings = () => {
  const { t } = useTranslation(['common', 'settings'])
  const { mangoAccountAddress } = useMangoAccount()
  const { group } = useMangoGroup()
  const [showAccountSizeModal, setShowAccountSizeModal] = useState(false)
  const {
    usedTokens,
    usedSerum3,
    usedPerps,
    usedPerpOo,
    totalTokens,
    totalSerum3,
    totalPerps,
    totalPerpOpenOrders,
    isAccountFull,
  } = useMangoAccountAccounts()

  return mangoAccountAddress && group ? (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base">{t('account')}</h2>
        {!isAccountFull ? (
          <LinkButton
            className="flex items-center"
            onClick={() => setShowAccountSizeModal(true)}
          >
            <SquaresPlusIcon className="mr-1.5 h-4 w-4" />
            {t('settings:increase-account-size')}
          </LinkButton>
        ) : (
          <div className="flex items-center">
            <ExclamationCircleIcon className="mr-1.5 h-4 w-4 text-th-error" />
            <p className="text-th-error">
              {t('settings:error-account-size-full')}
            </p>
          </div>
        )}
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
