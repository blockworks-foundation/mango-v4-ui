import { useCallback, useEffect, useState } from 'react'
import { ChevronDownIcon, NoSymbolIcon } from '@heroicons/react/20/solid'
import dayjs from 'dayjs'
import { useTranslation } from 'next-i18next'
import Image from 'next/legacy/image'
import { breakpoints } from '../../utils/theme'
import { useViewport } from '../../hooks/useViewport'
import { LinkButton } from '../shared/Button'
import { Disclosure, Transition } from '@headlessui/react'
import SheenLoader from '../shared/SheenLoader'
import mangoStore from '@store/mangoStore'
import { countLeadingZeros, floorToDecimal } from '../../utils/numbers'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { PAGINATION_PAGE_LENGTH, PREFERRED_EXPLORER_KEY } from 'utils/constants'
import Tooltip from '@components/shared/Tooltip'
import { formatTokenSymbol } from 'utils/tokens'
import {
  SortableColumnHeader,
  Table,
  Td,
  Th,
  TrBody,
  TrHead,
} from '@components/shared/TableElements'
import { EXPLORERS } from '@components/settings/PreferredExplorerSettings'
import useMangoAccount from 'hooks/useMangoAccount'
import ConnectEmptyState from '@components/shared/ConnectEmptyState'
import { useWallet } from '@solana/wallet-adapter-react'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import useMangoGroup from 'hooks/useMangoGroup'
import TokenLogo from '@components/shared/TokenLogo'
import { useSortableData } from 'hooks/useSortableData'

const SwapHistoryTable = () => {
  const { t } = useTranslation(['common', 'settings', 'swap'])
  const swapHistory = mangoStore((s) => s.mangoAccount.swapHistory.data)
  const loadSwapHistory = mangoStore((s) => s.mangoAccount.swapHistory.loading)
  const { group } = useMangoGroup()
  const [offset, setOffset] = useState(0)
  const actions = mangoStore.getState().actions
  const { mangoAccountAddress } = useMangoAccount()
  const { connected } = useWallet()
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false
  const [preferredExplorer] = useLocalStorageState(
    PREFERRED_EXPLORER_KEY,
    EXPLORERS[0],
  )

  useEffect(() => {
    if (mangoAccountAddress) {
      actions.fetchSwapHistory(mangoAccountAddress)
      setOffset(0)
    }
  }, [actions, mangoAccountAddress])

  const handleShowMore = useCallback(() => {
    const set = mangoStore.getState().set
    set((s) => {
      s.mangoAccount.swapHistory.loading = true
    })
    if (!mangoAccountAddress) return
    setOffset(offset + PAGINATION_PAGE_LENGTH)
    actions.fetchSwapHistory(
      mangoAccountAddress,
      0,
      offset + PAGINATION_PAGE_LENGTH,
    )
  }, [actions, offset, mangoAccountAddress])

  const formattedTableData = useCallback(() => {
    const formatted = []
    for (const swap of swapHistory) {
      const {
        block_datetime,
        signature,
        swap_in_amount,
        swap_in_loan_origination_fee,
        swap_in_symbol,
        swap_out_amount,
        loan,
        loan_origination_fee,
        swap_out_symbol,
        swap_out_price_usd,
      } = swap

      const borrowAmount =
        loan > 0 ? `${floorToDecimal(loan, countLeadingZeros(loan) + 2)}` : 0
      const borrowFee =
        swap_in_loan_origination_fee > 0
          ? swap_in_loan_origination_fee.toFixed(4)
          : loan_origination_fee > 0
          ? loan_origination_fee.toFixed(4)
          : 0

      const bankInSymbol =
        swap_in_symbol === 'ETH' ? 'ETH (Portal)' : swap_in_symbol
      const bankOutSymbol =
        swap_out_symbol === 'ETH' ? 'ETH (Portal)' : swap_out_symbol

      const inBank = group?.banksMapByName.get(bankInSymbol)?.[0]
      const outBank = group?.banksMapByName.get(bankOutSymbol)?.[0]

      const inSymbol = formatTokenSymbol(swap_in_symbol)
      const outSymbol = formatTokenSymbol(swap_out_symbol)

      const inDecimals = countLeadingZeros(swap_in_amount) + 2
      const outDecimals = countLeadingZeros(swap_out_amount) + 2

      const value = swap_out_price_usd * swap_out_amount

      const data = {
        block_datetime,
        borrowAmount,
        borrowFee,
        inBank,
        inDecimals,
        inSymbol,
        outBank,
        outDecimals,
        outSymbol,
        signature,
        swap_in_amount,
        swap_out_amount,
        value,
      }
      formatted.push(data)
    }
    return formatted
  }, [group, swapHistory])

  const {
    items: tableData,
    requestSort,
    sortConfig,
  } = useSortableData(formattedTableData())

  return group &&
    mangoAccountAddress &&
    (tableData.length || loadSwapHistory) ? (
    <>
      {showTableView ? (
        <Table>
          <thead>
            <TrHead>
              <Th className="text-left">
                <SortableColumnHeader
                  sortKey="block_datetime"
                  sort={() => requestSort('block_datetime')}
                  sortConfig={sortConfig}
                  title={t('date')}
                />
              </Th>
              <Th className="text-left">
                <SortableColumnHeader
                  sortKey="swap_in_amount"
                  sort={() => requestSort('swap_in_amount')}
                  sortConfig={sortConfig}
                  title={t('swap:paid')}
                />
              </Th>
              <Th className="text-left">
                <SortableColumnHeader
                  sortKey="swap_out_amount"
                  sort={() => requestSort('swap_out_amount')}
                  sortConfig={sortConfig}
                  title={t('swap:received')}
                />
              </Th>
              <Th>
                <div className="flex justify-end">
                  <SortableColumnHeader
                    sortKey="value"
                    sort={() => requestSort('value')}
                    sortConfig={sortConfig}
                    title={t('value')}
                  />
                </div>
              </Th>
              <Th>
                <div className="flex justify-end">
                  <SortableColumnHeader
                    sortKey="borrowAmount"
                    sort={() => requestSort('borrowAmount')}
                    sortConfig={sortConfig}
                    title={t('borrow')}
                  />
                </div>
              </Th>
              <Th>
                <div className="flex justify-end">
                  <Tooltip content={t('tooltip-borrow-fee')}>
                    <SortableColumnHeader
                      sortKey="borrowFee"
                      sort={() => requestSort('borrowFee')}
                      sortConfig={sortConfig}
                      title={t('borrow-fee')}
                    />
                  </Tooltip>
                </div>
              </Th>
              <Th />
            </TrHead>
          </thead>
          <tbody>
            {tableData.map((swap) => {
              const {
                block_datetime,
                borrowAmount,
                borrowFee,
                inBank,
                inDecimals,
                inSymbol,
                outBank,
                outDecimals,
                outSymbol,
                signature,
                swap_in_amount,
                swap_out_amount,
                value,
              } = swap
              return (
                <TrBody key={signature}>
                  <Td>
                    <p className="font-body tracking-wider">
                      {dayjs(block_datetime).format('ddd D MMM')}
                    </p>
                    <p className="font-body text-xs text-th-fgd-3">
                      {dayjs(block_datetime).format('h:mma')}
                    </p>
                  </Td>
                  <Td>
                    <div className="flex items-center">
                      {inBank ? (
                        <div className="mr-2.5 flex shrink-0 items-center">
                          <TokenLogo bank={inBank} />
                        </div>
                      ) : null}
                      <p className="whitespace-nowrap">
                        <FormatNumericValue
                          value={swap_in_amount}
                          decimals={inDecimals}
                        />{' '}
                        <span className="font-body text-th-fgd-3">
                          {inSymbol}
                        </span>
                      </p>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center">
                      {outBank ? (
                        <div className="mr-2.5 flex shrink-0 items-center">
                          <TokenLogo bank={outBank} />
                        </div>
                      ) : null}
                      <p className="whitespace-nowrap">
                        <FormatNumericValue
                          value={swap_out_amount}
                          decimals={outDecimals}
                        />{' '}
                        <span className="font-body text-th-fgd-3">
                          {outSymbol}
                        </span>
                      </p>
                    </div>
                  </Td>
                  <Td>
                    <p className="text-right">
                      <FormatNumericValue value={value} decimals={2} isUsd />
                    </p>
                  </Td>
                  <Td>
                    <div className="flex flex-col text-right">
                      <p>
                        {borrowAmount}
                        <span className="ml-1 font-body text-th-fgd-3">
                          {inSymbol}
                        </span>
                      </p>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex flex-col text-right">
                      <p>
                        {borrowFee}
                        <span className="ml-1 font-body text-th-fgd-3">
                          {inSymbol}
                        </span>
                      </p>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center justify-end">
                      <Tooltip
                        content={`View on ${t(
                          `settings:${preferredExplorer.name}`,
                        )}`}
                        placement="top-end"
                      >
                        <a
                          href={`${preferredExplorer.url}${signature}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <div className="h-6 w-6">
                            <Image
                              alt=""
                              width="24"
                              height="24"
                              src={`/explorer-logos/${preferredExplorer.name}.png`}
                            />
                          </div>
                        </a>
                      </Tooltip>
                    </div>
                  </Td>
                </TrBody>
              )
            })}
          </tbody>
        </Table>
      ) : (
        <div>
          {tableData.map((swap, i) => {
            const {
              block_datetime,
              borrowAmount,
              borrowFee,
              inDecimals,
              inSymbol,
              outDecimals,
              outSymbol,
              signature,
              swap_in_amount,
              swap_out_amount,
              value,
            } = swap

            return (
              <Disclosure key={signature}>
                {({ open }) => (
                  <>
                    <Disclosure.Button
                      className={`w-full border-t border-th-bkg-3 p-4 text-left focus:outline-none ${
                        i === 0 ? 'border-t-0' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="whitespace-nowrap text-sm text-th-fgd-1">
                            {dayjs(block_datetime).format('ddd D MMM')}
                          </p>
                          <p className="text-xs text-th-fgd-3">
                            {dayjs(block_datetime).format('h:mma')}
                          </p>
                        </div>
                        <div className="flex items-center justify-end pl-4">
                          <div className="mr-3 flex items-center">
                            <p className="text-right font-mono text-th-fgd-1">
                              <FormatNumericValue
                                value={swap_in_amount}
                                decimals={inDecimals}
                              />{' '}
                              <span className="font-body text-th-fgd-2">
                                {inSymbol}
                              </span>{' '}
                              <span className="font-body text-th-fgd-4">
                                to
                              </span>{' '}
                              <FormatNumericValue
                                value={swap_out_amount}
                                decimals={outDecimals}
                              />{' '}
                              <span className="font-body text-th-fgd-2">
                                {outSymbol}
                              </span>
                            </p>
                          </div>
                          <ChevronDownIcon
                            className={`${
                              open ? 'rotate-180' : 'rotate-0'
                            } h-6 w-6 shrink-0 text-th-fgd-3`}
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
                            <p className="text-xs text-th-fgd-3">
                              {t('value')}
                            </p>
                            <p className="font-mono text-th-fgd-1">
                              <FormatNumericValue value={value} isUsd />
                            </p>
                          </div>
                          {borrowAmount ? (
                            <>
                              <div className="col-span-1">
                                <p className="text-xs text-th-fgd-3">
                                  {t('borrow')}
                                </p>
                                <p className="font-mono text-th-fgd-1">
                                  {borrowAmount}{' '}
                                  <span className="font-body text-th-fgd-3">
                                    {inSymbol}
                                  </span>
                                </p>
                              </div>
                              <div className="col-span-1">
                                <p className="text-xs text-th-fgd-3">
                                  {t('borrow-fee')}
                                </p>
                                <p className="font-mono text-th-fgd-1">
                                  ${borrowFee}
                                </p>
                              </div>
                            </>
                          ) : null}
                          <div className="col-span-1">
                            <p className="mb-0.5 text-xs text-th-fgd-3">
                              {t('transaction')}
                            </p>
                            <a
                              className="flex items-center text-th-fgd-1 hover:text-th-fgd-3"
                              href={`${preferredExplorer.url}${signature}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Image
                                alt=""
                                width="16"
                                height="16"
                                src={`/explorer-logos/${preferredExplorer.name}.png`}
                              />
                              <span className="ml-1.5">
                                {t(`settings:${preferredExplorer.name}`)}
                              </span>
                            </a>
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
      {loadSwapHistory ? (
        <div className="mt-4 space-y-1.5">
          {[...Array(4)].map((x, i) => (
            <SheenLoader className="mx-4 flex flex-1 md:mx-6" key={i}>
              <div className="h-16 w-full bg-th-bkg-2" />
            </SheenLoader>
          ))}
        </div>
      ) : null}
      {swapHistory.length &&
      swapHistory.length % PAGINATION_PAGE_LENGTH === 0 ? (
        <div className="flex justify-center py-6">
          <LinkButton onClick={handleShowMore}>Show More</LinkButton>
        </div>
      ) : null}
    </>
  ) : mangoAccountAddress || connected ? (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="flex flex-col items-center p-8">
        <NoSymbolIcon className="mb-2 h-6 w-6 text-th-fgd-4" />
        <p>{t('swap:no-history')}</p>
      </div>
    </div>
  ) : (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <ConnectEmptyState text={t('swap:connect-swap')} />
    </div>
  )
}

export default SwapHistoryTable
