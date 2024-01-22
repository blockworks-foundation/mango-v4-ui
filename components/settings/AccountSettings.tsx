import HideMangoAccount from '@components/account/HideMangoAccount'
import MangoAccountSizeModal from '@components/modals/MangoAccountSizeModal'
import Button, { IconButton, LinkButton } from '@components/shared/Button'
import TokenLogo from '@components/shared/TokenLogo'
import Tooltip from '@components/shared/Tooltip'
import MarketLogos from '@components/trade/MarketLogos'
import { Disclosure } from '@headlessui/react'
import {
  ChevronDownIcon,
  DocumentDuplicateIcon,
  PencilIcon,
  SquaresPlusIcon,
  TrashIcon,
  UserPlusIcon,
} from '@heroicons/react/20/solid'
import useMangoAccount from 'hooks/useMangoAccount'
import useMangoAccountAccounts from 'hooks/useMangoAccountAccounts'
import useMangoGroup from 'hooks/useMangoGroup'
import { useTranslation } from 'next-i18next'
import { useCallback, useMemo, useState } from 'react'
import { PRIVACY_MODE } from 'utils/constants'
import mangoStore from '@store/mangoStore'
import { PublicKey } from '@solana/web3.js'
import { notify } from 'utils/notifications'
import { isMangoError } from 'types'
import { getMaxWithdrawForBank } from '@components/swap/useTokenMax'
import Decimal from 'decimal.js'
import { formatTokenSymbol } from 'utils/tokens'
import { handleCancelAll } from '@components/swap/SwapTriggerOrders'
import { handleCopyAddress } from '@components/account/AccountActions'
import AccountNameModal from '@components/modals/AccountNameModal'
import DelegateModal, {
  DEFAULT_DELEGATE,
} from '@components/modals/DelegateModal'
import { abbreviateAddress } from 'utils/formatting'
import CloseAccountModal from '@components/modals/CloseAccountModal'
import useLocalStorageState from 'hooks/useLocalStorageState'
import Switch from '@components/forms/Switch'
import useUnownedAccount from 'hooks/useUnownedAccount'
import { useWallet } from '@solana/wallet-adapter-react'
import CreateAccountForm from '@components/account/CreateAccountForm'
import ConnectEmptyState from '@components/shared/ConnectEmptyState'
import { Serum3Market } from '@blockworks-foundation/mango-v4'

export const SETTINGS_BUTTON_TITLE_CLASSES = 'text-th-fgd-1'

const CLOSE_WRAPPER_CLASSNAMES =
  'mb-4 flex flex-col md:flex-row md:items-center md:justify-between rounded-md bg-th-bkg-2 px-4 py-3'

const SLOT_ROW_CLASSNAMES =
  'flex items-center justify-between border-t border-th-bkg-3 py-3'

const ROW_BUTTON_CLASSNAMES =
  'flex items-center justify-between border-t border-th-bkg-3 py-4 w-full md:px-4 focus:outline-none md:hover:bg-th-bkg-2'

const AccountSettings = () => {
  const { t } = useTranslation(['common', 'settings', 'trade'])
  const { mangoAccount, mangoAccountAddress } = useMangoAccount()
  const { group } = useMangoGroup()
  const { isDelegatedAccount, isUnownedAccount } = useUnownedAccount()
  const { connected } = useWallet()
  const [showAccountSizeModal, setShowAccountSizeModal] = useState(false)
  const [showEditAccountModal, setShowEditAccountModal] = useState(false)
  const [showCloseAccountModal, setShowCloseAccountModal] = useState(false)
  const [privacyMode, setPrivacyMode] = useLocalStorageState(PRIVACY_MODE)
  const [showDelegateModal, setShowDelegateModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [cancelTcs, setCancelTcs] = useState('')
  const {
    usedTokens,
    usedSerum3,
    usedPerps,
    usedPerpOo,
    usedTcs,
    emptySerum3,
    emptyPerps,
    totalTokens,
    totalSerum3,
    totalPerps,
    totalPerpOpenOrders,
    isAccountFull,
  } = useMangoAccountAccounts()

  const tokenStatus = useMemo(() => {
    const mangoAccount = mangoStore.getState().mangoAccount.current
    if (!group || !mangoAccount || !usedTokens.length) return []
    const tokens = []
    for (const token of usedTokens) {
      const bank = group.getFirstBankByTokenIndex(token.tokenIndex)
      const tokenMax = getMaxWithdrawForBank(group, bank, mangoAccount)
      const balance = mangoAccount.getTokenBalanceUi(bank)
      const isClosable = tokenMax.eq(new Decimal(balance)) && !token.inUseCount
      tokens.push({ isClosable, balance, tokenIndex: token.tokenIndex })
    }
    return tokens
  }, [group, mangoAccountAddress, usedTokens])

  const handleCloseToken = useCallback(
    async (tokenMint: PublicKey) => {
      const client = mangoStore.getState().client
      const group = mangoStore.getState().group
      const actions = mangoStore.getState().actions
      if (!mangoAccount || !group) return

      setSubmitting(true)

      try {
        const { signature: tx, slot } =
          await client.tokenWithdrawAllDepositForMint(
            group,
            mangoAccount,
            tokenMint,
          )
        notify({
          title: 'Transaction confirmed',
          type: 'success',
          txid: tx,
        })
        await actions.reloadMangoAccount(slot)
        setSubmitting(false)
      } catch (e) {
        console.error(e)
        setSubmitting(false)
        if (!isMangoError(e)) return
        notify({
          title: 'Transaction failed',
          description: e.message,
          txid: e?.txid,
          type: 'error',
        })
      }
    },
    [mangoAccount, setSubmitting],
  )

  const handleCloseSerumOos = useCallback(
    async (market: Serum3Market) => {
      const client = mangoStore.getState().client
      const group = mangoStore.getState().group
      const actions = mangoStore.getState().actions
      if (!mangoAccount || !group) return
      setSubmitting(true)
      try {
        const ix = await client.serum3CloseOpenOrdersIx(
          group,
          mangoAccount,
          market.serumMarketExternal,
        )
        const tx = await client.sendAndConfirmTransaction([ix])

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
      } finally {
        setSubmitting(false)
      }
    },
    [mangoAccount],
  )

  const handleClosePerpAccounts = useCallback(
    async (marketIndex: number) => {
      const client = mangoStore.getState().client
      const group = mangoStore.getState().group
      const actions = mangoStore.getState().actions
      if (!mangoAccount || !group) return
      setSubmitting(true)
      try {
        const ix = await client.perpDeactivatePositionIx(
          group,
          mangoAccount,
          marketIndex,
        )
        const tx = await client.sendAndConfirmTransaction([ix])
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
      } finally {
        setSubmitting(false)
      }
    },
    [mangoAccount],
  )

  const getSlotsUsedColor = (used: number, total: number) => {
    if (used === total) {
      return 'text-th-error'
    } else if (used / total >= 0.75) {
      return 'text-th-warning'
    } else return 'text-th-success'
  }

  return mangoAccount && group && !isDelegatedAccount && !isUnownedAccount ? (
    <div className="border-b border-th-bkg-3">
      <div className="pb-6">
        <h3 className="mb-1 text-base text-th-fgd-1">
          {t('settings:account-address')}
        </h3>
        <div className="flex items-center space-x-2">
          <p className="truncate">{mangoAccount.publicKey.toString()}</p>
          <IconButton
            hideBg
            onClick={() =>
              handleCopyAddress(
                mangoAccount.publicKey.toString(),
                t('copy-address-success', {
                  pk: abbreviateAddress(mangoAccount.publicKey),
                }),
              )
            }
          >
            <DocumentDuplicateIcon className="h-5 w-5" />
          </IconButton>
        </div>
      </div>
      <div className="mb-6 border-b border-th-bkg-3">
        <button
          className={ROW_BUTTON_CLASSNAMES}
          onClick={() => setShowEditAccountModal(true)}
        >
          <p className={SETTINGS_BUTTON_TITLE_CLASSES}>{t('edit-account')}</p>
          <div className="flex items-center space-x-2">
            <p className="text-th-fgd-2">{mangoAccount.name}</p>
            <PencilIcon className="h-5 w-5 text-th-fgd-2" />
          </div>
        </button>
        <button
          className={ROW_BUTTON_CLASSNAMES}
          onClick={() => setShowDelegateModal(true)}
        >
          <div>
            <div className="w-max">
              <Tooltip content={t('delegate-account-tooltip')}>
                <p
                  className={`tooltip-underline mb-1 text-left ${SETTINGS_BUTTON_TITLE_CLASSES}`}
                >
                  {t('delegate-account')}
                </p>
              </Tooltip>
            </div>
            <p className="text-left">{t('delegate-account-desc')}</p>
          </div>
          <div className="flex items-center space-x-2 pl-4">
            <p className="whitespace-nowrap text-th-fgd-2">
              {mangoAccount.delegate.toString() !== DEFAULT_DELEGATE
                ? abbreviateAddress(mangoAccount.delegate)
                : ''}
            </p>
            <UserPlusIcon className="h-5 w-5 text-th-fgd-2" />
          </div>
        </button>
        <button
          className={ROW_BUTTON_CLASSNAMES}
          onClick={() => setShowCloseAccountModal(true)}
        >
          <p className={SETTINGS_BUTTON_TITLE_CLASSES}>{t('close-account')}</p>
          <TrashIcon className="h-5 w-5 text-th-fgd-2" />
        </button>
      </div>
      <div className="mb-4">
        <div>
          <h3 className="mb-1 text-base text-th-fgd-1">
            {t('settings:account-slots')}
          </h3>
          <p>{t('settings:account-slots-desc')}</p>
        </div>
        {!isAccountFull ? (
          <LinkButton
            className="mt-3 flex items-center"
            onClick={() => setShowAccountSizeModal(true)}
          >
            <SquaresPlusIcon className="mr-1.5 h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">
              {t('settings:increase-account-slots')}
            </span>
          </LinkButton>
        ) : null}
      </div>
      <div className="border-b border-th-bkg-3">
        <Disclosure>
          {({ open }) => (
            <>
              <Disclosure.Button className="w-full border-t border-th-bkg-3 py-4 md:px-4 md:hover:bg-th-bkg-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-left text-th-fgd-1">{t('tokens')}</p>
                    <p
                      className={`mt-1 ${getSlotsUsedColor(
                        usedTokens.length,
                        totalTokens.length,
                      )}`}
                    >
                      {t('settings:slots-used', {
                        used: usedTokens.length,
                        total: totalTokens.length,
                        type: t('tokens').toLowerCase(),
                      })}
                    </p>
                  </div>
                  <ChevronDownIcon
                    className={`${
                      open ? 'rotate-180' : 'rotate-0'
                    } h-6 w-6 shrink-0 text-th-fgd-3`}
                  />
                </div>
              </Disclosure.Button>
              <Disclosure.Panel className="py-2 md:px-4">
                <div className={CLOSE_WRAPPER_CLASSNAMES}>
                  <p className="mt-1">
                    {t('settings:close-token-positions-desc')}
                  </p>
                </div>
                {usedTokens.length ? (
                  usedTokens.map((token, i) => {
                    const tokenBank = group.getFirstBankByTokenIndex(
                      token.tokenIndex,
                    )
                    const status = tokenStatus.find(
                      (t) => t.tokenIndex === token.tokenIndex,
                    )

                    const isCollateral =
                      tokenBank
                        .scaledInitAssetWeight(tokenBank.price)
                        .toNumber() > 0
                    return (
                      <div
                        className={SLOT_ROW_CLASSNAMES}
                        key={token.tokenIndex}
                      >
                        <div className="flex items-center">
                          <p className="mr-3 text-th-fgd-4">{i + 1}.</p>
                          <TokenLogo bank={tokenBank} size={20} />
                          <div className="ml-2">
                            <p className="text-th-fgd-2">{tokenBank.name}</p>
                            <p className="font-mono text-xs text-th-fgd-4">
                              {status?.balance}
                            </p>
                          </div>
                        </div>
                        {status?.isClosable ? (
                          <Button
                            disabled={submitting}
                            onClick={() => handleCloseToken(tokenBank.mint)}
                            secondary
                            size="small"
                          >
                            {t('close')}
                          </Button>
                        ) : (
                          <Tooltip
                            content={
                              tokenBank.name === 'USDC'
                                ? t('settings:tooltip-close-usdc-instructions')
                                : isCollateral
                                ? t(
                                    'settings:tooltip-close-collateral-token-instructions',
                                    {
                                      token: tokenBank.name,
                                    },
                                  )
                                : t(
                                    'settings:tooltip-close-token-instructions',
                                    {
                                      token: tokenBank.name,
                                    },
                                  )
                            }
                          >
                            <p className="tooltip-underline">
                              {t('settings:close-instructions')}
                            </p>
                          </Tooltip>
                        )}
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
              <Disclosure.Button className="w-full border-t border-th-bkg-3 py-4 md:px-4 md:hover:bg-th-bkg-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-left text-th-fgd-1">
                      {t('settings:spot-markets')}
                    </p>
                    <p
                      className={`mt-1 ${getSlotsUsedColor(
                        usedSerum3.length,
                        totalSerum3.length,
                      )}`}
                    >
                      {t('settings:slots-used', {
                        used: usedSerum3.length,
                        total: totalSerum3.length,
                        type: t('settings:spot-markets').toLowerCase(),
                      })}
                    </p>
                  </div>
                  <ChevronDownIcon
                    className={`${
                      open ? 'rotate-180' : 'rotate-0'
                    } h-6 w-6 shrink-0 text-th-fgd-3`}
                  />
                </div>
              </Disclosure.Button>
              <Disclosure.Panel className="py-2 md:px-4">
                <div className={CLOSE_WRAPPER_CLASSNAMES}>
                  <p className="mt-1">{t('settings:close-spot-oo-desc')}</p>
                </div>
                {usedSerum3.length ? (
                  usedSerum3.map((mkt, i) => {
                    const market = group.getSerum3MarketByMarketIndex(
                      mkt.marketIndex,
                    )
                    const isUnused = !!emptySerum3.find(
                      (m) => m.marketIndex === mkt.marketIndex,
                    )
                    return (
                      <div
                        className={SLOT_ROW_CLASSNAMES}
                        key={mkt.marketIndex}
                      >
                        <div className="flex items-center">
                          <p className="mr-3 text-th-fgd-4">{i + 1}.</p>
                          <MarketLogos market={market} />
                          <p className="text-th-fgd-2">{market.name}</p>
                        </div>
                        {isUnused ? (
                          <Button
                            disabled={submitting}
                            onClick={() => handleCloseSerumOos(market)}
                            size="small"
                          >
                            {t('close')}
                          </Button>
                        ) : (
                          <IsUnusedBadge isUnused={isUnused} />
                        )}
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
              <Disclosure.Button className="w-full border-t border-th-bkg-3 py-4 md:px-4 md:hover:bg-th-bkg-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-left text-th-fgd-1">
                      {t('settings:perp-markets')}
                    </p>
                    <p
                      className={`mt-1 ${getSlotsUsedColor(
                        usedPerps.length,
                        totalPerps.length,
                      )}`}
                    >
                      {t('settings:slots-used', {
                        used: usedPerps.length,
                        total: totalPerps.length,
                        type: t('settings:perp-positions').toLowerCase(),
                      })}
                    </p>
                  </div>
                  <ChevronDownIcon
                    className={`${
                      open ? 'rotate-180' : 'rotate-0'
                    } h-6 w-6 shrink-0 text-th-fgd-3`}
                  />
                </div>
              </Disclosure.Button>
              <Disclosure.Panel className="py-2 md:px-4">
                <div className={CLOSE_WRAPPER_CLASSNAMES}>
                  <p className="mt-1">{t('settings:close-perp-desc')}</p>
                </div>
                {usedPerps.length ? (
                  usedPerps.map((perp, i) => {
                    const market = group.getPerpMarketByMarketIndex(
                      perp.marketIndex,
                    )
                    const isUnused = !!emptyPerps.find(
                      (mkt) => mkt.marketIndex === perp.marketIndex,
                    )
                    return (
                      <div
                        className={SLOT_ROW_CLASSNAMES}
                        key={perp.marketIndex}
                      >
                        <div className="flex items-center">
                          <p className="mr-3 text-th-fgd-4">{i + 1}.</p>
                          <MarketLogos market={market} />
                          <p className="text-th-fgd-2">{market.name}</p>
                        </div>
                        {isUnused ? (
                          <Button
                            disabled={submitting}
                            onClick={() =>
                              handleClosePerpAccounts(perp.marketIndex)
                            }
                            size="small"
                          >
                            {t('close')}
                          </Button>
                        ) : (
                          <IsUnusedBadge isUnused={isUnused} />
                        )}
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
              <Disclosure.Button className="w-full border-t border-th-bkg-3 py-4 md:px-4 md:hover:bg-th-bkg-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-left text-th-fgd-1">
                      {t('settings:perp-open-orders')}
                    </p>
                    <p
                      className={`mt-1 ${getSlotsUsedColor(
                        usedPerpOo.length,
                        totalPerpOpenOrders.length,
                      )}`}
                    >
                      {t('settings:slots-used', {
                        used: usedPerpOo.length,
                        total: totalPerpOpenOrders.length,
                        type: t('settings:perp-open-orders').toLowerCase(),
                      })}
                    </p>
                  </div>
                  <ChevronDownIcon
                    className={`${
                      open ? 'rotate-180' : 'rotate-0'
                    } h-6 w-6 shrink-0 text-th-fgd-3`}
                  />
                </div>
              </Disclosure.Button>
              <Disclosure.Panel className="py-2 md:px-4">
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
        <Disclosure>
          {({ open }) => (
            <>
              <Disclosure.Button className="w-full border-t border-th-bkg-3 py-4 md:px-4 md:hover:bg-th-bkg-2">
                <div className="flex items-center justify-between">
                  <p className={SETTINGS_BUTTON_TITLE_CLASSES}>
                    {t('trade:trigger-orders')}
                  </p>
                  <ChevronDownIcon
                    className={`${
                      open ? 'rotate-180' : 'rotate-0'
                    } h-6 w-6 shrink-0 text-th-fgd-3`}
                  />
                </div>
              </Disclosure.Button>
              <Disclosure.Panel className="py-2 md:px-4">
                <div className={CLOSE_WRAPPER_CLASSNAMES}>
                  <p className="font-bold text-th-fgd-2">
                    {t('settings:trigger-orders-used', {
                      orders: usedTcs.length,
                    })}
                  </p>
                  <Button
                    className="mt-4 whitespace-nowrap md:ml-4 md:mt-0"
                    disabled={!usedTcs.length || !!cancelTcs}
                    onClick={() => handleCancelAll(setCancelTcs)}
                    secondary
                    size="small"
                  >
                    {t('trade:cancel-all')}
                  </Button>
                </div>
                {usedTcs.length ? (
                  usedTcs.map((tcs, i) => {
                    const buyBank = group.getFirstBankByTokenIndex(
                      tcs.buyTokenIndex,
                    )
                    const sellBank = group.getFirstBankByTokenIndex(
                      tcs.sellTokenIndex,
                    )
                    const maxBuy = tcs.getMaxBuyUi(group)
                    const maxSell = tcs.getMaxSellUi(group)
                    let side
                    if (maxBuy === 0 || maxBuy > maxSell) {
                      side = 'sell'
                    } else {
                      side = 'buy'
                    }
                    const formattedBuyTokenName = formatTokenSymbol(
                      buyBank.name,
                    )
                    const formattedSellTokenName = formatTokenSymbol(
                      sellBank.name,
                    )
                    const pair =
                      side === 'sell'
                        ? `${formattedSellTokenName}/${formattedBuyTokenName}`
                        : `${formattedBuyTokenName}/${formattedSellTokenName}`
                    return (
                      <div
                        className="mb-2 flex items-center"
                        key={tcs.id.toString()}
                      >
                        <p className="mr-3 text-th-fgd-4">{i + 1}.</p>
                        <p className="text-th-fgd-2">{pair}</p>
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
      </div>
      <div className="pt-6">
        <h3 className="mb-4 text-base text-th-fgd-1">
          {t('settings:privacy')}
        </h3>
        <div className="flex items-center justify-between border-t border-th-bkg-3 py-4 md:px-4">
          <Tooltip content={t('settings:tooltip-privacy-mode')}>
            <p className={`tooltip-underline ${SETTINGS_BUTTON_TITLE_CLASSES}`}>
              {t('settings:privacy-mode')}
            </p>
          </Tooltip>
          <Switch
            checked={privacyMode}
            onChange={() => setPrivacyMode(!privacyMode)}
          />
        </div>
        <HideMangoAccount />
      </div>
      {showAccountSizeModal ? (
        <MangoAccountSizeModal
          isOpen={showAccountSizeModal}
          onClose={() => setShowAccountSizeModal(false)}
        />
      ) : null}
      {showEditAccountModal ? (
        <AccountNameModal
          isOpen={showEditAccountModal}
          onClose={() => setShowEditAccountModal(false)}
        />
      ) : null}
      {showDelegateModal ? (
        <DelegateModal
          isOpen={showDelegateModal}
          onClose={() => setShowDelegateModal(false)}
        />
      ) : null}
      {showCloseAccountModal ? (
        <CloseAccountModal
          isOpen={showCloseAccountModal}
          onClose={() => setShowCloseAccountModal(false)}
        />
      ) : null}
    </div>
  ) : isUnownedAccount ? (
    <div className="rounded-lg border border-th-bkg-3 p-4 md:p-6">
      <p className="text-center">{t('settings:account-settings-unowned')}</p>
    </div>
  ) : isDelegatedAccount ? (
    <div className="rounded-lg border border-th-bkg-3 p-4 md:p-6">
      <p className="text-center">{t('settings:account-settings-delegated')}</p>
    </div>
  ) : connected ? (
    <div className="rounded-lg border border-th-bkg-3 p-4 md:p-6">
      <CreateAccountForm />
    </div>
  ) : (
    <div className="rounded-lg border border-th-bkg-3 p-4 md:p-6">
      <ConnectEmptyState text="Connect" />
    </div>
  )
}

export default AccountSettings

const IsUnusedBadge = ({ isUnused }: { isUnused: boolean }) => {
  const { t } = useTranslation('settings')
  return (
    <div className="rounded bg-th-bkg-2 px-1 py-0.5 text-xs text-th-fgd-3">
      <span className="uppercase">
        {isUnused ? (
          t('settings:unused')
        ) : (
          <span className="text-th-success">{t('settings:in-use')}</span>
        )}
      </span>
    </div>
  )
}
