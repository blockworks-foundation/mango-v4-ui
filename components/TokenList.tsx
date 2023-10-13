import { Bank } from '@blockworks-foundation/mango-v4'
import { Disclosure, Popover, Transition } from '@headlessui/react'
import {
  ChevronDownIcon,
  EllipsisHorizontalIcon,
  XMarkIcon,
} from '@heroicons/react/20/solid'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { Fragment, useCallback, useMemo, useState } from 'react'
import { useViewport } from '../hooks/useViewport'
import mangoStore from '@store/mangoStore'
import { breakpoints } from '../utils/theme'
import Switch from './forms/Switch'
import ContentBox from './shared/ContentBox'
import Tooltip from './shared/Tooltip'
import { formatTokenSymbol } from 'utils/tokens'
import useMangoAccount from 'hooks/useMangoAccount'
import {
  SortableColumnHeader,
  Table,
  Td,
  Th,
  TrBody,
  TrHead,
} from './shared/TableElements'
import DepositWithdrawModal from './modals/DepositWithdrawModal'
import BorrowRepayModal from './modals/BorrowRepayModal'
import { WRAPPED_SOL_MINT } from '@project-serum/serum/lib/token-instructions'
import {
  SHOW_ZERO_BALANCES_KEY,
  TOKEN_REDUCE_ONLY_OPTIONS,
  USDC_MINT,
} from 'utils/constants'
import { PublicKey } from '@solana/web3.js'
import ActionsLinkButton from './account/ActionsLinkButton'
import FormatNumericValue from './shared/FormatNumericValue'
import BankAmountWithValue from './shared/BankAmountWithValue'
import useBanksWithBalances, {
  BankWithBalance,
} from 'hooks/useBanksWithBalances'
import useUnownedAccount from 'hooks/useUnownedAccount'
import useLocalStorageState from 'hooks/useLocalStorageState'
import TokenLogo from './shared/TokenLogo'
import useHealthContributions from 'hooks/useHealthContributions'
import { useSortableData } from 'hooks/useSortableData'
import TableTokenName from './shared/TableTokenName'

type TableData = {
  bank: Bank
  balance: number
  symbol: string
  interestAmount: number
  interestValue: number
  inOrders: number
  unsettled: number
  collateralValue: number
  assetWeight: string
  liabWeight: string
  depositRate: number
  borrowRate: number
}

const TokenList = () => {
  const { t } = useTranslation(['common', 'token', 'trade'])
  const [showZeroBalances, setShowZeroBalances] = useLocalStorageState(
    SHOW_ZERO_BALANCES_KEY,
    true,
  )
  const { mangoAccountAddress } = useMangoAccount()
  const { initContributions } = useHealthContributions()
  const spotBalances = mangoStore((s) => s.mangoAccount.spotBalances)
  const totalInterestData = mangoStore(
    (s) => s.mangoAccount.interestTotals.data,
  )
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false
  const banks = useBanksWithBalances('balance')

  const formattedTableData = useCallback(
    (banks: BankWithBalance[]) => {
      const formatted = []
      for (const b of banks) {
        const bank = b.bank
        const balance = b.balance
        const balanceValue = balance * bank.uiPrice
        const symbol = bank.name === 'MSOL' ? 'mSOL' : bank.name

        const hasInterestEarned = totalInterestData.find(
          (d) =>
            d.symbol.toLowerCase() === symbol.toLowerCase() ||
            (symbol === 'ETH (Portal)' && d.symbol === 'ETH'),
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

        const unsettled = spotBalances[bank.mint.toString()]?.unsettled || 0

        const collateralValue =
          initContributions.find((val) => val.asset === bank.name)
            ?.contribution || 0

        const assetWeight = bank.scaledInitAssetWeight(bank.price).toFixed(2)
        const liabWeight = bank.scaledInitLiabWeight(bank.price).toFixed(2)

        const depositRate = bank.getDepositRateUi()
        const borrowRate = bank.getBorrowRateUi()

        const data = {
          balance,
          balanceValue,
          bank,
          symbol,
          interestAmount,
          interestValue,
          inOrders,
          unsettled,
          collateralValue,
          assetWeight,
          liabWeight,
          depositRate,
          borrowRate,
        }
        formatted.push(data)
      }
      return formatted
    },
    [initContributions, spotBalances, totalInterestData],
  )

  const unsortedTableData = useMemo(() => {
    if (!banks.length) return []
    if (showZeroBalances || !mangoAccountAddress) {
      return formattedTableData(banks)
    } else {
      const filtered = banks.filter((b) => Math.abs(b.balance) > 0)
      return formattedTableData(filtered)
    }
  }, [banks, mangoAccountAddress, showZeroBalances, totalInterestData])

  const {
    items: tableData,
    requestSort,
    sortConfig,
  } = useSortableData(unsortedTableData)

  return (
    <ContentBox hideBorder hidePadding>
      {mangoAccountAddress ? (
        <div className="flex w-full items-center justify-end border-b border-th-bkg-3 px-6 py-3 lg:-mt-[36px] lg:mb-4 lg:mr-12 lg:w-auto lg:border-0 lg:py-0">
          <Switch
            checked={showZeroBalances}
            disabled={!mangoAccountAddress}
            onChange={() => setShowZeroBalances(!showZeroBalances)}
          >
            {t('account:zero-balances')}
          </Switch>
        </div>
      ) : null}
      {showTableView ? (
        <>
          <Table>
            <thead>
              <TrHead>
                <Th className="text-left">
                  <SortableColumnHeader
                    sortKey="symbol"
                    sort={() => requestSort('symbol')}
                    sortConfig={sortConfig}
                    title={t('token')}
                  />
                </Th>
                <Th>
                  <div className="flex justify-end">
                    <Tooltip content="A negative balance represents a borrow">
                      <SortableColumnHeader
                        sortKey="balanceValue"
                        sort={() => requestSort('balanceValue')}
                        sortConfig={sortConfig}
                        title={t('balance')}
                        titleClass="tooltip-underline"
                      />
                    </Tooltip>
                  </div>
                </Th>
                <Th>
                  <div className="flex justify-end">
                    <Tooltip content={t('tooltip-collateral-value')}>
                      <SortableColumnHeader
                        sortKey="collateralValue"
                        sort={() => requestSort('collateralValue')}
                        sortConfig={sortConfig}
                        title={t('collateral-value')}
                        titleClass="tooltip-underline"
                      />
                    </Tooltip>
                  </div>
                </Th>
                <Th>
                  <div className="flex justify-end">
                    <SortableColumnHeader
                      sortKey="inOrders"
                      sort={() => requestSort('inOrders')}
                      sortConfig={sortConfig}
                      title={t('trade:in-orders')}
                    />
                  </div>
                </Th>
                <Th>
                  <div className="flex justify-end">
                    <Tooltip content="The sum of interest earned and interest paid for each token">
                      <SortableColumnHeader
                        sortKey="interestValue"
                        sort={() => requestSort('interestValue')}
                        sortConfig={sortConfig}
                        title={t('interest-earned-paid')}
                        titleClass="tooltip-underline"
                      />
                    </Tooltip>
                  </div>
                </Th>
                <Th>
                  <div className="flex justify-end">
                    <Tooltip content={t('tooltip-interest-rates')}>
                      <SortableColumnHeader
                        sortKey="depositRate"
                        sort={() => requestSort('depositRate')}
                        sortConfig={sortConfig}
                        title={t('rates')}
                        titleClass="tooltip-underline"
                      />
                    </Tooltip>
                  </div>
                </Th>
                <Th className="text-right">
                  <span>{t('actions')}</span>
                </Th>
              </TrHead>
            </thead>
            <tbody>
              {tableData.map((data) => {
                const {
                  balance,
                  bank,
                  symbol,
                  interestValue,
                  inOrders,
                  collateralValue,
                  assetWeight,
                  liabWeight,
                  depositRate,
                  borrowRate,
                } = data

                return (
                  <TrBody key={symbol}>
                    <Td>
                      <TableTokenName bank={bank} symbol={symbol} />
                    </Td>
                    <Td className="text-right">
                      <BankAmountWithValue
                        amount={balance}
                        bank={bank}
                        stacked
                      />
                    </Td>
                    <Td className="text-right">
                      <p>
                        <FormatNumericValue
                          value={collateralValue}
                          decimals={2}
                          isUsd
                        />
                      </p>
                      <p className="text-sm text-th-fgd-4">
                        <FormatNumericValue
                          value={
                            collateralValue <= -0.01 ? liabWeight : assetWeight
                          }
                        />
                        x
                      </p>
                    </Td>
                    <Td className="text-right">
                      {inOrders ? (
                        <BankAmountWithValue
                          amount={inOrders}
                          bank={bank}
                          stacked
                        />
                      ) : (
                        <p className="text-th-fgd-4">–</p>
                      )}
                    </Td>
                    <Td>
                      <div className="flex justify-end">
                        {Math.abs(interestValue) > 0 ? (
                          <p>
                            <FormatNumericValue
                              value={interestValue}
                              isUsd
                              decimals={2}
                            />
                          </p>
                        ) : (
                          <p className="text-th-fgd-4">–</p>
                        )}
                      </div>
                    </Td>
                    <Td>
                      <div className="flex justify-end space-x-1.5">
                        <Tooltip content={t('deposit-rate')}>
                          <p className="cursor-help text-th-up">
                            <FormatNumericValue
                              value={depositRate}
                              decimals={2}
                            />
                            %
                          </p>
                        </Tooltip>
                        <span className="text-th-fgd-4">|</span>
                        <Tooltip content={t('borrow-rate')}>
                          <p className="cursor-help text-th-down">
                            <FormatNumericValue
                              value={borrowRate}
                              decimals={2}
                            />
                            %
                          </p>
                        </Tooltip>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex items-center justify-end">
                        <ActionsMenu bank={bank} />
                      </div>
                    </Td>
                  </TrBody>
                )
              })}
            </tbody>
          </Table>
        </>
      ) : (
        <div className="border-b border-th-bkg-3">
          {tableData.map((data) => {
            return <MobileTokenListItem key={data.bank.name} data={data} />
          })}
        </div>
      )}
    </ContentBox>
  )
}

export default TokenList

const MobileTokenListItem = ({ data }: { data: TableData }) => {
  const { t } = useTranslation(['common', 'token'])
  const { mangoAccount } = useMangoAccount()
  const {
    bank,
    balance,
    symbol,
    interestAmount,
    interestValue,
    inOrders,
    unsettled,
    collateralValue,
    assetWeight,
    liabWeight,
    depositRate,
    borrowRate,
  } = data

  return (
    <Disclosure>
      {({ open }) => (
        <>
          <Disclosure.Button
            className={`w-full border-t border-th-bkg-3 p-4 text-left first:border-t-0 focus:outline-none`}
          >
            <div className="flex items-center justify-between">
              <TableTokenName bank={bank} symbol={symbol} />
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <p className="font-mono text-sm text-th-fgd-2">
                    <FormatNumericValue
                      value={balance}
                      decimals={bank.mintDecimals}
                    />
                  </p>
                  <span className="font-mono text-xs text-th-fgd-3">
                    <FormatNumericValue
                      value={mangoAccount ? balance * bank.uiPrice : 0}
                      decimals={2}
                      isUsd
                    />
                  </span>
                </div>
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
              <div className="mx-4 grid grid-cols-2 gap-4 border-t border-th-bkg-3 pb-4 pt-4">
                <div className="col-span-1">
                  <Tooltip content={t('tooltip-collateral-value')}>
                    <p className="tooltip-underline text-xs text-th-fgd-3">
                      {t('collateral-value')}
                    </p>
                  </Tooltip>
                  <p className="font-mono text-th-fgd-2">
                    <FormatNumericValue
                      value={collateralValue}
                      decimals={2}
                      isUsd
                    />
                    <span className="text-th-fgd-3">
                      {' '}
                      <FormatNumericValue
                        value={
                          collateralValue <= -0.01 ? liabWeight : assetWeight
                        }
                      />
                      x
                    </span>
                  </p>
                </div>
                <div className="col-span-1">
                  <p className="text-xs text-th-fgd-3">
                    {t('trade:in-orders')}
                  </p>
                  <BankAmountWithValue amount={inOrders} bank={bank} />
                </div>
                <div className="col-span-1">
                  <p className="text-xs text-th-fgd-3">
                    {t('trade:unsettled')}
                  </p>
                  <BankAmountWithValue amount={unsettled} bank={bank} />
                </div>
                <div className="col-span-1">
                  <p className="text-xs text-th-fgd-3">
                    {t('interest-earned-paid')}
                  </p>
                  <BankAmountWithValue
                    amount={interestAmount}
                    bank={bank}
                    value={interestValue}
                  />
                </div>
                <div className="col-span-1">
                  <p className="text-xs text-th-fgd-3">{t('rates')}</p>
                  <p className="space-x-2 font-mono">
                    <span className="text-th-up">
                      <FormatNumericValue value={depositRate} decimals={2} />%
                    </span>
                    <span className="font-normal text-th-fgd-4">|</span>
                    <span className="text-th-down">
                      <FormatNumericValue value={borrowRate} decimals={2} />%
                    </span>
                  </p>
                </div>
                <div className="col-span-1">
                  <ActionsMenu bank={bank} />
                </div>
              </div>
            </Disclosure.Panel>
          </Transition>
        </>
      )}
    </Disclosure>
  )
}

export const ActionsMenu = ({
  bank,
  showText,
}: {
  bank: Bank
  showText?: boolean
}) => {
  const { t } = useTranslation('common')
  const { mangoAccountAddress } = useMangoAccount()
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [showBorrowModal, setShowBorrowModal] = useState(false)
  const [showRepayModal, setShowRepayModal] = useState(false)
  const [selectedToken, setSelectedToken] = useState('')
  const set = mangoStore.getState().set
  const router = useRouter()
  const spotMarkets = mangoStore((s) => s.serumMarkets)
  const { isUnownedAccount } = useUnownedAccount()
  const { isDesktop } = useViewport()

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
    [],
  )

  const balance = useMemo(() => {
    if (!mangoAccountAddress || !bank) return 0
    const mangoAccount = mangoStore.getState().mangoAccount.current
    if (mangoAccount) {
      return mangoAccount.getTokenBalanceUi(bank)
    } else return 0
  }, [bank, mangoAccountAddress])

  const handleSwap = useCallback(() => {
    const group = mangoStore.getState().group
    if (balance > 0) {
      if (bank.name === 'USDC') {
        const solBank = group?.getFirstBankByMint(WRAPPED_SOL_MINT)
        set((s) => {
          s.swap.inputBank = bank
          s.swap.outputBank = solBank
        })
      } else {
        const usdcBank = group?.getFirstBankByMint(new PublicKey(USDC_MINT))
        set((s) => {
          s.swap.inputBank = bank
          s.swap.outputBank = usdcBank
        })
      }
    } else {
      if (bank.name === 'USDC') {
        const solBank = group?.getFirstBankByMint(WRAPPED_SOL_MINT)
        set((s) => {
          s.swap.inputBank = solBank
          s.swap.outputBank = bank
        })
      } else {
        const usdcBank = group?.getFirstBankByMint(new PublicKey(USDC_MINT))
        set((s) => {
          s.swap.inputBank = usdcBank
          s.swap.outputBank = bank
        })
      }
    }
    router.push('/swap', undefined, { shallow: true })
  }, [bank, router, set])

  const handleTrade = useCallback(() => {
    router.push(`/trade?name=${spotMarket?.name}`, undefined, { shallow: true })
  }, [spotMarket, router])

  return (
    <>
      {isUnownedAccount ? null : (
        <Popover>
          {({ open }) => (
            <div className="relative">
              <Popover.Button
                className={`flex items-center justify-center border border-th-button text-th-fgd-1 md:hover:border-th-button-hover md:hover:text-th-fgd-1 ${
                  showText || !isDesktop
                    ? 'h-10 w-full rounded-md'
                    : 'h-8 w-8 rounded-full'
                }`}
              >
                {showText || !isDesktop ? (
                  <span className="mr-2 font-display">{t('actions')}</span>
                ) : null}
                {open ? (
                  <XMarkIcon className="h-5 w-5" />
                ) : (
                  <EllipsisHorizontalIcon className="h-5 w-5" />
                )}
              </Popover.Button>
              <Transition
                appear={true}
                show={open}
                as={Fragment}
                enter="transition ease-in duration-100"
                enterFrom="scale-90"
                enterTo="scale-100"
                leave="transition ease-out duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Popover.Panel
                  className={`thin-scroll absolute z-20 max-h-60 w-32 space-y-2 overflow-auto rounded-md bg-th-bkg-2 p-4 ${
                    isDesktop && !showText
                      ? 'bottom-0 left-auto right-12 pt-2'
                      : 'bottom-12 left-0'
                  }`}
                >
                  {!showText && isDesktop ? (
                    <div className="flex items-center justify-center border-b border-th-bkg-3 pb-2">
                      <div className="mr-2 flex flex-shrink-0 items-center">
                        <TokenLogo bank={bank} size={20} />
                      </div>
                      <p className="font-body">
                        {formatTokenSymbol(bank.name)}
                      </p>
                    </div>
                  ) : null}
                  {bank.reduceOnly !== TOKEN_REDUCE_ONLY_OPTIONS.ENABLED ? (
                    <ActionsLinkButton
                      onClick={() =>
                        handleShowActionModals(bank.name, 'deposit')
                      }
                    >
                      {t('deposit')}
                    </ActionsLinkButton>
                  ) : null}
                  {balance < 0 ? (
                    <ActionsLinkButton
                      onClick={() => handleShowActionModals(bank.name, 'repay')}
                    >
                      {t('repay')}
                    </ActionsLinkButton>
                  ) : null}
                  {balance && balance > 0 ? (
                    <ActionsLinkButton
                      onClick={() =>
                        handleShowActionModals(bank.name, 'withdraw')
                      }
                    >
                      {t('withdraw')}
                    </ActionsLinkButton>
                  ) : null}
                  {bank.reduceOnly === TOKEN_REDUCE_ONLY_OPTIONS.DISABLED ? (
                    <ActionsLinkButton
                      onClick={() =>
                        handleShowActionModals(bank.name, 'borrow')
                      }
                    >
                      {t('borrow')}
                    </ActionsLinkButton>
                  ) : null}
                  <ActionsLinkButton onClick={handleSwap}>
                    {t('swap')}
                  </ActionsLinkButton>
                  {spotMarket ? (
                    <ActionsLinkButton onClick={handleTrade}>
                      {t('trade')}
                    </ActionsLinkButton>
                  ) : null}
                </Popover.Panel>
              </Transition>
            </div>
          )}
        </Popover>
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
