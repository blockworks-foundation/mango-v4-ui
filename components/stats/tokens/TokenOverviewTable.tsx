import { Disclosure, Transition } from '@headlessui/react'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import { useTranslation } from 'next-i18next'
import { useViewport } from '../../../hooks/useViewport'
import { breakpoints } from '../../../utils/theme'
import { LinkButton } from '../../shared/Button'
import ContentBox from '../../shared/ContentBox'
import Tooltip from '@components/shared/Tooltip'
import { Bank, toUiDecimals } from '@blockworks-foundation/mango-v4'
import { NextRouter, useRouter } from 'next/router'
import {
  SortableColumnHeader,
  Table,
  Td,
  Th,
  TrBody,
  TrHead,
} from '@components/shared/TableElements'
import useMangoGroup from 'hooks/useMangoGroup'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import BankAmountWithValue from '@components/shared/BankAmountWithValue'
import useBanksWithBalances from 'hooks/useBanksWithBalances'
import Decimal from 'decimal.js'
import { useCallback } from 'react'
import { useSortableData } from 'hooks/useSortableData'
import TableTokenName from '@components/shared/TableTokenName'
import { formatTokenSymbol } from 'utils/tokens'

export const goToTokenPage = (token: string, router: NextRouter) => {
  const query = { ...router.query, ['token']: token }
  router.push({ pathname: router.pathname, query })
}

const TokenOverviewTable = () => {
  const { t } = useTranslation(['common', 'token'])
  const { group } = useMangoGroup()
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false
  const router = useRouter()
  const banks = useBanksWithBalances()

  const formattedTableData = useCallback(() => {
    const formatted = []
    for (const b of banks) {
      const bank: Bank = b.bank
      const deposits = bank.uiDeposits()
      const depositsValue = deposits * bank.uiPrice
      const borrows = bank.uiBorrows()
      const borrowsValue = borrows * bank.uiPrice
      const availableVaultBalance = group
        ? group.getTokenVaultBalanceByMintUi(bank.mint) -
          deposits * bank.minVaultToDepositsRatio
        : 0
      const available = Decimal.max(
        0,
        availableVaultBalance.toFixed(bank.mintDecimals),
      )
      const availableValue = available.toNumber() * bank.uiPrice
      const feesEarned = toUiDecimals(
        bank.collectedFeesNative,
        bank.mintDecimals,
      )
      const feeValue = feesEarned * bank.uiPrice
      const utilization =
        bank.uiDeposits() > 0 ? (bank.uiBorrows() / bank.uiDeposits()) * 100 : 0

      const depositRate = bank.getDepositRateUi()
      const borrowRate = bank.getBorrowRateUi()
      const symbol = bank.name

      const data = {
        available,
        availableValue,
        bank,
        borrowRate,
        borrows,
        borrowsValue,
        depositRate,
        deposits,
        depositsValue,
        feesEarned,
        feeValue,
        symbol,
        utilization,
      }
      formatted.push(data)
    }
    return formatted.sort(
      (a, b) => b.deposits * b.bank.uiPrice - a.deposits * a.bank.uiPrice,
    )
  }, [banks, group])

  const {
    items: tableData,
    requestSort,
    sortConfig,
  } = useSortableData(formattedTableData())

  return (
    <ContentBox hideBorder hidePadding>
      {showTableView ? (
        <div className="thin-scroll overflow-x-auto">
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
                    <SortableColumnHeader
                      sortKey="depositsValue"
                      sort={() => requestSort('depositsValue')}
                      sortConfig={sortConfig}
                      title={t('total-deposits')}
                    />
                  </div>
                </Th>
                <Th>
                  <div className="flex justify-end">
                    <SortableColumnHeader
                      sortKey="borrowsValue"
                      sort={() => requestSort('borrowsValue')}
                      sortConfig={sortConfig}
                      title={t('total-borrows')}
                    />
                  </div>
                </Th>
                <Th className="text-right">
                  <div className="flex justify-end">
                    <Tooltip content={t('tooltip-available', { token: '' })}>
                      <SortableColumnHeader
                        sortKey="availableValue"
                        sort={() => requestSort('availableValue')}
                        sortConfig={sortConfig}
                        title={t('available')}
                        titleClass="tooltip-underline"
                      />
                    </Tooltip>
                  </div>
                </Th>
                <Th>
                  <div className="flex justify-end">
                    <Tooltip content={t('token:fees-tooltip')}>
                      <SortableColumnHeader
                        sortKey="feeValue"
                        sort={() => requestSort('feeValue')}
                        sortConfig={sortConfig}
                        title={t('fees')}
                        titleClass="tooltip-underline"
                      />
                    </Tooltip>
                  </div>
                </Th>
                <Th>
                  <div className="flex justify-end">
                    <Tooltip content="The deposit rate (green) will automatically be paid on positive balances and the borrow rate (red) will automatically be charged on negative balances.">
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
                <Th>
                  <div className="flex justify-end">
                    <Tooltip content="The percentage of deposits that have been lent out">
                      <SortableColumnHeader
                        sortKey="utilization"
                        sort={() => requestSort('utilization')}
                        sortConfig={sortConfig}
                        title={t('utilization')}
                        titleClass="tooltip-underline"
                      />
                    </Tooltip>
                  </div>
                </Th>
                <Th />
              </TrHead>
            </thead>
            <tbody>
              {tableData.map((data) => {
                const {
                  available,
                  bank,
                  borrows,
                  borrowRate,
                  deposits,
                  depositRate,
                  feesEarned,
                  symbol,
                  utilization,
                } = data

                return (
                  <TrBody
                    className="default-transition md:hover:cursor-pointer md:hover:bg-th-bkg-2"
                    key={symbol}
                    onClick={() =>
                      goToTokenPage(bank.name.split(' ')[0], router)
                    }
                  >
                    <Td>
                      <TableTokenName bank={bank} symbol={symbol} />
                    </Td>
                    <Td>
                      <div className="flex flex-col text-right">
                        <BankAmountWithValue
                          amount={deposits.toFixed(4)}
                          bank={bank}
                          fixDecimals={false}
                          stacked
                        />
                      </div>
                    </Td>
                    <Td>
                      <div className="flex flex-col text-right">
                        <BankAmountWithValue
                          amount={borrows.toFixed(4)}
                          bank={bank}
                          fixDecimals={false}
                          stacked
                        />
                      </div>
                    </Td>
                    <Td>
                      <div className="flex flex-col text-right">
                        <BankAmountWithValue
                          amount={available}
                          bank={bank}
                          fixDecimals={false}
                          stacked
                        />
                      </div>
                    </Td>
                    <Td>
                      <div className="flex flex-col text-right">
                        <BankAmountWithValue
                          amount={feesEarned}
                          bank={bank}
                          fixDecimals={false}
                          stacked
                        />
                      </div>
                    </Td>
                    <Td>
                      <div className="flex justify-end space-x-1.5">
                        <p className="text-th-up">
                          <FormatNumericValue
                            value={depositRate}
                            decimals={2}
                          />
                          %
                        </p>
                        <span className="text-th-fgd-4">|</span>
                        <p className="text-th-down">
                          <FormatNumericValue value={borrowRate} decimals={2} />
                          %
                        </p>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex flex-col text-right">
                        <p>{utilization.toFixed(1)}%</p>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex justify-end">
                        <ChevronRightIcon className="h-5 w-5 text-th-fgd-3" />
                      </div>
                    </Td>
                  </TrBody>
                )
              })}
            </tbody>
          </Table>
        </div>
      ) : (
        <div className="border-b border-th-bkg-3">
          {tableData.map((data, i) => {
            const {
              available,
              bank,
              borrows,
              borrowRate,
              deposits,
              depositRate,
              feesEarned,
              symbol,
              utilization,
            } = data

            return (
              <Disclosure key={symbol}>
                {({ open }) => (
                  <>
                    <Disclosure.Button
                      className={`w-full border-t border-th-bkg-3 p-4 text-left focus:outline-none ${
                        i === 0 ? 'border-t-0' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <TableTokenName bank={bank} symbol={symbol} />
                        <ChevronDownIcon
                          className={`${
                            open ? 'rotate-180' : 'rotate-0'
                          } h-6 w-6 shrink-0 text-th-fgd-3`}
                        />
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
                            <p className="mb-0.5 text-xs">
                              {t('total-deposits')}
                            </p>
                            <BankAmountWithValue
                              amount={deposits.toFixed(4)}
                              bank={bank}
                              fixDecimals={false}
                            />
                          </div>
                          <div className="col-span-1">
                            <p className="mb-0.5 text-xs">
                              {t('total-borrows')}
                            </p>
                            <BankAmountWithValue
                              amount={borrows.toFixed(4)}
                              bank={bank}
                              fixDecimals={false}
                            />
                          </div>
                          <div className="col-span-1">
                            <Tooltip content="The amount available to borrow">
                              <p className="tooltip-underline text-xs">
                                {t('available')}
                              </p>
                            </Tooltip>
                            <BankAmountWithValue
                              amount={available}
                              bank={bank}
                              fixDecimals={false}
                            />
                          </div>
                          <div className="col-span-1">
                            <Tooltip content={t('token:fees-tooltip')}>
                              <p className="tooltip-underline text-xs">
                                {t('fees')}
                              </p>
                            </Tooltip>
                            <BankAmountWithValue
                              amount={feesEarned}
                              bank={bank}
                              fixDecimals={false}
                            />
                          </div>
                          <div className="col-span-1">
                            <p className="text-xs">{t('rates')}</p>
                            <p className="space-x-2">
                              <span className="font-mono text-th-up">
                                <FormatNumericValue
                                  value={depositRate}
                                  decimals={2}
                                />
                                %
                              </span>
                              <span className="font-normal text-th-fgd-4">
                                |
                              </span>
                              <span className="font-mono text-th-down">
                                <FormatNumericValue
                                  value={borrowRate}
                                  decimals={2}
                                />
                                %
                              </span>
                            </p>
                          </div>
                          <div className="col-span-1">
                            <p className="text-xs">{t('utilization')}</p>
                            <p className="font-mono text-th-fgd-1">
                              {utilization.toFixed(1)}%
                            </p>
                          </div>
                          <div className="col-span-1">
                            <LinkButton
                              className="flex items-center"
                              onClick={() =>
                                goToTokenPage(bank.name.split(' ')[0], router)
                              }
                            >
                              {t('token:token-stats', {
                                token: formatTokenSymbol(bank.name),
                              })}
                              <ChevronRightIcon className="ml-2 h-5 w-5" />
                            </LinkButton>
                          </div>
                        </div>
                      </Disclosure.Panel>
                    </Transition>
                  </>
                )}
              </Disclosure>
            )
          })}
        </div>
      )}
    </ContentBox>
  )
}

export default TokenOverviewTable
