import { Bank, MangoAccount } from '@blockworks-foundation/mango-v4'
import { Disclosure, Transition } from '@headlessui/react'
import {
  ChevronDownIcon,
  EllipsisHorizontalIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/20/solid'
import { useTranslation } from 'next-i18next'
import Image from 'next/legacy/image'
import { useRouter } from 'next/router'
import { useCallback, useMemo, useState } from 'react'
import { useViewport } from '../hooks/useViewport'
import mangoStore from '@store/mangoStore'
import { breakpoints } from '../utils/theme'
import Switch from './forms/Switch'
import ContentBox from './shared/ContentBox'
import IconDropMenu from './shared/IconDropMenu'
import Tooltip from './shared/Tooltip'
import { formatTokenSymbol } from 'utils/tokens'
import useMangoAccount from 'hooks/useMangoAccount'
import useJupiterMints from '../hooks/useJupiterMints'
import { Table, Td, Th, TrBody, TrHead } from './shared/TableElements'
import DepositWithdrawModal from './modals/DepositWithdrawModal'
import BorrowRepayModal from './modals/BorrowRepayModal'
import { WRAPPED_SOL_MINT } from '@project-serum/serum/lib/token-instructions'
import { SHOW_ZERO_BALANCES_KEY, USDC_MINT } from 'utils/constants'
import { PublicKey } from '@solana/web3.js'
import ActionsLinkButton from './account/ActionsLinkButton'
import FormatNumericValue from './shared/FormatNumericValue'
import BankAmountWithValue from './shared/BankAmountWithValue'
import useBanksWithBalances, {
  BankWithBalance,
} from 'hooks/useBanksWithBalances'
import useUnownedAccount from 'hooks/useUnownedAccount'
import useLocalStorageState from 'hooks/useLocalStorageState'

const TokenList = () => {
  const { t } = useTranslation(['common', 'token', 'trade'])
  const [showZeroBalances, setShowZeroBalances] = useLocalStorageState(
    SHOW_ZERO_BALANCES_KEY,
    true
  )
  const { mangoAccount, mangoAccountAddress } = useMangoAccount()
  const spotBalances = mangoStore((s) => s.mangoAccount.spotBalances)
  const { mangoTokens } = useJupiterMints()
  const totalInterestData = mangoStore(
    (s) => s.mangoAccount.interestTotals.data
  )
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false
  const banks = useBanksWithBalances('balance')

  const filteredBanks = useMemo(() => {
    if (banks.length) {
      return showZeroBalances || !mangoAccountAddress
        ? banks
        : banks.filter((b) => Math.abs(b.balance) > 0)
    }
    return []
  }, [banks, mangoAccountAddress, showZeroBalances])

  return (
    <ContentBox hideBorder hidePadding>
      {mangoAccountAddress ? (
        <div className="flex w-full items-center justify-end border-b border-th-bkg-3 py-3 px-6 lg:-mt-[36px] lg:mb-4 lg:w-auto lg:border-0 lg:py-0">
          <Switch
            checked={showZeroBalances}
            disabled={!mangoAccount}
            onChange={() => setShowZeroBalances(!showZeroBalances)}
          >
            {t('show-zero-balances')}
          </Switch>
        </div>
      ) : null}
      {showTableView ? (
        <Table>
          <thead>
            <TrHead>
              <Th className="text-left">{t('token')}</Th>
              <Th>
                <div className="flex justify-end">
                  <Tooltip content="A negative balance represents a borrow">
                    <span className="tooltip-underline">{t('balance')}</span>
                  </Tooltip>
                </div>
              </Th>
              <Th className="text-right">{t('trade:in-orders')}</Th>
              <Th className="text-right">{t('trade:unsettled')}</Th>
              <Th className="flex justify-end" id="account-step-nine">
                <Tooltip content="The sum of interest earned and interest paid for each token">
                  <span className="tooltip-underline">
                    {t('interest-earned-paid')}
                  </span>
                </Tooltip>
              </Th>
              <Th id="account-step-ten">
                <div className="flex justify-end">
                  <Tooltip content="The interest rates for depositing (green/left) and borrowing (red/right)">
                    <span className="tooltip-underline">{t('rates')}</span>
                  </Tooltip>
                </div>
              </Th>
              <Th className="text-right">
                <span>{t('actions')}</span>
              </Th>
            </TrHead>
          </thead>
          <tbody>
            {filteredBanks.map((b) => {
              const bank = b.bank

              let logoURI
              if (mangoTokens?.length) {
                logoURI = mangoTokens.find(
                  (t) => t.address === bank.mint.toString()
                )?.logoURI
              }

              const tokenBalance = b.balance

              const hasInterestEarned = totalInterestData.find(
                (d) => d.symbol === bank.name
              )

              const interestAmount = hasInterestEarned
                ? hasInterestEarned.borrow_interest * -1 +
                  hasInterestEarned.deposit_interest
                : 0

              const interestValue = hasInterestEarned
                ? hasInterestEarned.borrow_interest_usd * -1 +
                  hasInterestEarned.deposit_interest_usd
                : 0.0

              const inOrders = spotBalances[bank.mint.toString()]?.inOrders || 0

              const unsettled =
                spotBalances[bank.mint.toString()]?.unsettled || 0

              return (
                <TrBody key={bank.name}>
                  <Td>
                    <div className="flex items-center">
                      <div className="mr-2.5 flex flex-shrink-0 items-center">
                        {logoURI ? (
                          <Image alt="" width="24" height="24" src={logoURI} />
                        ) : (
                          <QuestionMarkCircleIcon className="h-6 w-6 text-th-fgd-3" />
                        )}
                      </div>
                      <p className="font-body">{bank.name}</p>
                    </div>
                  </Td>
                  <Td className="text-right">
                    <BankAmountWithValue
                      amount={tokenBalance}
                      bank={bank}
                      stacked
                    />
                  </Td>
                  <Td className="text-right">
                    <BankAmountWithValue
                      amount={inOrders}
                      bank={bank}
                      stacked
                    />
                  </Td>
                  <Td className="text-right">
                    <BankAmountWithValue
                      amount={unsettled}
                      bank={bank}
                      stacked
                    />
                  </Td>
                  <Td>
                    <div className="flex flex-col text-right">
                      <BankAmountWithValue
                        amount={interestAmount}
                        bank={bank}
                        value={interestValue}
                        stacked
                      />
                    </div>
                  </Td>
                  <Td>
                    <div className="flex justify-end space-x-1.5">
                      <p className="text-th-up">
                        <FormatNumericValue
                          value={bank.getDepositRateUi()}
                          decimals={2}
                        />
                        %
                      </p>
                      <span className="text-th-fgd-4">|</span>
                      <p className="text-th-down">
                        <FormatNumericValue
                          value={bank.getBorrowRateUi()}
                          decimals={2}
                          roundUp
                        />
                        %
                      </p>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center justify-end">
                      <ActionsMenu bank={bank} mangoAccount={mangoAccount} />
                    </div>
                  </Td>
                </TrBody>
              )
            })}
          </tbody>
        </Table>
      ) : (
        <div className="border-b border-th-bkg-3">
          {filteredBanks.map((b) => {
            return <MobileTokenListItem key={b.bank.name} bank={b} />
          })}
        </div>
      )}
    </ContentBox>
  )
}

export default TokenList

const MobileTokenListItem = ({ bank }: { bank: BankWithBalance }) => {
  const { t } = useTranslation(['common', 'token'])
  const { mangoTokens } = useJupiterMints()
  const spotBalances = mangoStore((s) => s.mangoAccount.spotBalances)
  const { mangoAccount } = useMangoAccount()
  const totalInterestData = mangoStore(
    (s) => s.mangoAccount.interestTotals.data
  )
  const tokenBank = bank.bank
  const mint = tokenBank.mint
  const symbol = tokenBank.name

  let logoURI: string | undefined
  if (mangoTokens?.length) {
    logoURI = mangoTokens.find(
      (t) => t.address === tokenBank.mint.toString()
    )!.logoURI
  }

  const hasInterestEarned = totalInterestData.find((d) => d.symbol === symbol)

  const interestAmount = hasInterestEarned
    ? hasInterestEarned.borrow_interest * -1 +
      hasInterestEarned.deposit_interest
    : 0

  const interestValue = hasInterestEarned
    ? hasInterestEarned.borrow_interest_usd * -1 +
      hasInterestEarned.deposit_interest_usd
    : 0

  const tokenBalance = bank.balance

  const inOrders = spotBalances[mint.toString()]?.inOrders || 0

  const unsettled = spotBalances[mint.toString()]?.unsettled || 0

  return (
    <Disclosure>
      {({ open }) => (
        <>
          <Disclosure.Button
            className={`w-full border-t border-th-bkg-3 p-4 text-left first:border-t-0 focus:outline-none`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-start">
                <div className="mr-2.5 mt-0.5 flex flex-shrink-0 items-center">
                  {logoURI ? (
                    <Image alt="" width="24" height="24" src={logoURI} />
                  ) : (
                    <QuestionMarkCircleIcon className="h-7 w-7 text-th-fgd-3" />
                  )}
                </div>
                <div>
                  <p className="mb-0.5 leading-none text-th-fgd-1">{symbol}</p>
                  <p className="font-mono text-sm text-th-fgd-2">
                    <FormatNumericValue
                      value={tokenBalance}
                      decimals={tokenBank.mintDecimals}
                    />
                    <span className="mt-0.5 block text-sm leading-none text-th-fgd-4">
                      <FormatNumericValue
                        value={
                          mangoAccount ? tokenBalance * tokenBank.uiPrice : 0
                        }
                        decimals={2}
                        isUsd
                      />
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <ActionsMenu bank={tokenBank} mangoAccount={mangoAccount} />
                <ChevronDownIcon
                  className={`${
                    open ? 'rotate-180' : 'rotate-360'
                  } h-6 w-6 flex-shrink-0 text-th-fgd-3`}
                />
              </div>
            </div>
          </Disclosure.Button>
          <Transition
            enter="transition ease-in duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
          >
            <Disclosure.Panel>
              <div className="mx-4 grid grid-cols-2 gap-4 border-t border-th-bkg-3 pt-4 pb-4">
                <div className="col-span-1">
                  <p className="text-xs text-th-fgd-3">
                    {t('trade:in-orders')}
                  </p>
                  <BankAmountWithValue amount={inOrders} bank={tokenBank} />
                </div>
                <div className="col-span-1">
                  <p className="text-xs text-th-fgd-3">
                    {t('trade:unsettled')}
                  </p>
                  <BankAmountWithValue amount={unsettled} bank={tokenBank} />
                </div>
                <div className="col-span-1">
                  <p className="text-xs text-th-fgd-3">
                    {t('interest-earned-paid')}
                  </p>
                  <BankAmountWithValue
                    amount={interestAmount}
                    bank={tokenBank}
                    value={interestValue}
                  />
                </div>
                <div className="col-span-1">
                  <p className="text-xs text-th-fgd-3">{t('rates')}</p>
                  <p className="space-x-2 font-mono">
                    <span className="text-th-up">
                      <FormatNumericValue
                        value={tokenBank.getDepositRateUi()}
                        decimals={2}
                      />
                      %
                    </span>
                    <span className="font-normal text-th-fgd-4">|</span>
                    <span className="text-th-down">
                      <FormatNumericValue
                        value={tokenBank.getBorrowRateUi()}
                        decimals={2}
                        roundUp
                      />
                      %
                    </span>
                  </p>
                </div>
              </div>
            </Disclosure.Panel>
          </Transition>
        </>
      )}
    </Disclosure>
  )
}

const ActionsMenu = ({
  bank,
  mangoAccount,
}: {
  bank: Bank
  mangoAccount: MangoAccount | undefined
}) => {
  const { t } = useTranslation('common')
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [showBorrowModal, setShowBorrowModal] = useState(false)
  const [showRepayModal, setShowRepayModal] = useState(false)
  const [selectedToken, setSelectedToken] = useState('')
  const set = mangoStore.getState().set
  const router = useRouter()
  const { mangoTokens } = useJupiterMints()
  const spotMarkets = mangoStore((s) => s.serumMarkets)
  const { isUnownedAccount } = useUnownedAccount()

  const spotMarket = useMemo(() => {
    return spotMarkets.find((m) => {
      const base = m.name.split('/')[0]
      return base.toUpperCase() === bank.name.toUpperCase()
    })
  }, [spotMarkets])

  const handleShowActionModals = useCallback(
    (token: string, action: 'borrow' | 'deposit' | 'withdraw' | 'repay') => {
      setSelectedToken(token)
      action === 'borrow'
        ? setShowBorrowModal(true)
        : action === 'deposit'
        ? setShowDepositModal(true)
        : action === 'withdraw'
        ? setShowWithdrawModal(true)
        : setShowRepayModal(true)
    },
    []
  )

  const balance = useMemo(() => {
    if (!mangoAccount || !bank) return 0
    return mangoAccount.getTokenBalanceUi(bank)
  }, [bank, mangoAccount])

  const handleSwap = useCallback(() => {
    const tokenInfo = mangoTokens.find(
      (t) => t.address === bank.mint.toString()
    )
    const group = mangoStore.getState().group
    if (balance && balance > 0) {
      if (tokenInfo?.symbol === 'SOL') {
        const usdcTokenInfo = mangoTokens.find((t) => t.address === USDC_MINT)
        const usdcBank = group?.getFirstBankByMint(new PublicKey(USDC_MINT))
        set((s) => {
          s.swap.inputBank = usdcBank
          s.swap.inputTokenInfo = usdcTokenInfo
        })
      }
      set((s) => {
        s.swap.inputBank = bank
        s.swap.inputTokenInfo = tokenInfo
      })
    } else {
      if (tokenInfo?.symbol === 'USDC') {
        const solTokenInfo = mangoTokens.find(
          (t) => t.address === WRAPPED_SOL_MINT.toString()
        )
        const solBank = group?.getFirstBankByMint(WRAPPED_SOL_MINT)
        set((s) => {
          s.swap.inputBank = solBank
          s.swap.inputTokenInfo = solTokenInfo
        })
      }
      set((s) => {
        s.swap.outputBank = bank
        s.swap.outputTokenInfo = tokenInfo
      })
    }
    router.push('/swap', undefined, { shallow: true })
  }, [bank, router, set, mangoTokens, mangoAccount])

  const handleTrade = useCallback(() => {
    router.push(`/trade?name=${spotMarket?.name}`, undefined, { shallow: true })
  }, [spotMarket, router])

  const logoURI = useMemo(() => {
    if (!bank || !mangoTokens?.length) return ''
    return mangoTokens.find((t) => t.address === bank.mint.toString())?.logoURI
  }, [bank, mangoTokens])

  return (
    <>
      {isUnownedAccount ? null : (
        <IconDropMenu
          icon={<EllipsisHorizontalIcon className="h-5 w-5" />}
          panelClassName="w-40 shadow-md"
          postion="leftBottom"
        >
          <div className="flex items-center justify-center border-b border-th-bkg-3 pb-2">
            <div className="mr-2 flex flex-shrink-0 items-center">
              <Image alt="" width="20" height="20" src={logoURI || ''} />
            </div>
            <p className="font-body">{formatTokenSymbol(bank.name)}</p>
          </div>
          <ActionsLinkButton
            mangoAccount={mangoAccount!}
            onClick={() => handleShowActionModals(bank.name, 'deposit')}
          >
            {t('deposit')}
          </ActionsLinkButton>
          {balance < 0 ? (
            <ActionsLinkButton
              mangoAccount={mangoAccount!}
              onClick={() => handleShowActionModals(bank.name, 'repay')}
            >
              {t('repay')}
            </ActionsLinkButton>
          ) : null}
          {balance && balance > 0 ? (
            <ActionsLinkButton
              mangoAccount={mangoAccount!}
              onClick={() => handleShowActionModals(bank.name, 'withdraw')}
            >
              {t('withdraw')}
            </ActionsLinkButton>
          ) : null}
          <ActionsLinkButton
            mangoAccount={mangoAccount!}
            onClick={() => handleShowActionModals(bank.name, 'borrow')}
          >
            {t('borrow')}
          </ActionsLinkButton>
          <ActionsLinkButton mangoAccount={mangoAccount!} onClick={handleSwap}>
            {t('swap')}
          </ActionsLinkButton>
          {spotMarket ? (
            <ActionsLinkButton
              mangoAccount={mangoAccount!}
              onClick={handleTrade}
            >
              {t('trade')}
            </ActionsLinkButton>
          ) : null}
        </IconDropMenu>
      )}
      {showDepositModal ? (
        <DepositWithdrawModal
          action="deposit"
          isOpen={showDepositModal}
          onClose={() => setShowDepositModal(false)}
          token={selectedToken}
        />
      ) : null}
      {showWithdrawModal ? (
        <DepositWithdrawModal
          action="withdraw"
          isOpen={showWithdrawModal}
          onClose={() => setShowWithdrawModal(false)}
          token={selectedToken}
        />
      ) : null}
      {showBorrowModal ? (
        <BorrowRepayModal
          action="borrow"
          isOpen={showBorrowModal}
          onClose={() => setShowBorrowModal(false)}
          token={selectedToken}
        />
      ) : null}
      {showRepayModal ? (
        <BorrowRepayModal
          action="repay"
          isOpen={showRepayModal}
          onClose={() => setShowRepayModal(false)}
          token={selectedToken}
        />
      ) : null}
    </>
  )
}
