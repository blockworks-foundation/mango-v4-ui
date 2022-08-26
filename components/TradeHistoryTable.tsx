import { Fragment, useState } from 'react'
import {
  ArrowRightIcon,
  ChevronDownIcon,
  ClockIcon,
  ExternalLinkIcon,
  LinkIcon,
} from '@heroicons/react/solid'
import dayjs from 'dayjs'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import { FadeInList } from './shared/Transitions'
import { breakpoints } from '../utils/theme'
import { useViewport } from '../hooks/useViewport'
import { IconButton } from './shared/Button'
import { Transition } from '@headlessui/react'
import SheenLoader from './shared/SheenLoader'
import { useWallet } from '@solana/wallet-adapter-react'
import { TradeHistoryItem } from '../store/mangoStore'
import {
  countLeadingZeros,
  formatFixedDecimals,
  trimDecimals,
} from '../utils/numbers'

const TradeHistoryTable = ({
  tradeHistory,
  loading,
}: {
  tradeHistory: Array<TradeHistoryItem>
  loading: boolean
}) => {
  const { t } = useTranslation('common')
  const { connected } = useWallet()
  const [showTradeDetails, setTradeDetails] = useState('')
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false

  const handleShowTradeDetails = (signature: string) => {
    showTradeDetails ? setTradeDetails('') : setTradeDetails(signature)
  }

  return connected ? (
    !loading ? (
      tradeHistory.length ? (
        showTableView ? (
          <table className="mt-2 min-w-full">
            <thead>
              <tr>
                <th className="text-left">{t('date')}</th>
                <th className="w-1/3 text-left">{t('trade')}</th>
                <th className="text-right">{t('borrow')}</th>
                <th className="text-right">{t('borrow-fee')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {tradeHistory.map((h, index) => {
                const {
                  block_datetime,
                  signature,
                  swap_in_amount,
                  swap_in_loan_origination_fee,
                  swap_in_price_usd,
                  swap_in_symbol,
                  swap_out_amount,
                  loan,
                  loan_origination_fee,
                  swap_out_price_usd,
                  swap_out_symbol,
                } = h
                const borrowAmount =
                  loan > 0
                    ? `${trimDecimals(
                        loan,
                        countLeadingZeros(loan) + 2
                      )} ${swap_in_symbol}`
                    : 0
                const borrowFee =
                  swap_in_loan_origination_fee > 0
                    ? swap_in_loan_origination_fee.toFixed(4)
                    : loan_origination_fee > 0
                    ? loan_origination_fee.toFixed(4)
                    : 0

                const inDecimals = countLeadingZeros(swap_in_amount) + 2
                const outDecimals = countLeadingZeros(swap_out_amount) + 2
                return (
                  <tr key={signature}>
                    <td>
                      <p>{dayjs(block_datetime).format('ddd D MMM')}</p>
                      <p className="text-xs text-th-fgd-3">
                        {dayjs(block_datetime).format('h:mma')}
                      </p>
                    </td>
                    <td className="w-1/3">
                      <div className="flex items-center space-x-4">
                        <div className="flex w-1/2 items-center">
                          <div className="mr-2 flex flex-shrink-0 items-center">
                            <Image
                              alt=""
                              width="24"
                              height="24"
                              src={`/icons/${swap_in_symbol.toLowerCase()}.svg`}
                            />
                          </div>
                          <div>
                            <p className="mb-1.5 whitespace-nowrap leading-none">{`${trimDecimals(
                              swap_in_amount,
                              inDecimals
                            )} ${swap_in_symbol}`}</p>
                            <p className="text-xs leading-none text-th-fgd-3">
                              {formatFixedDecimals(swap_in_price_usd, true)}
                              <span className="mx-1 text-th-fgd-4">|</span>
                              {formatFixedDecimals(
                                swap_in_amount * swap_in_price_usd,
                                true
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="">
                          <ArrowRightIcon className="h-4 w-4 flex-shrink-0 text-th-fgd-4" />
                        </div>
                        <div className="flex w-1/2 items-center">
                          <div className="mr-2 flex flex-shrink-0 items-center">
                            <Image
                              alt=""
                              width="24"
                              height="24"
                              src={`/icons/${swap_out_symbol.toLowerCase()}.svg`}
                            />
                          </div>
                          <div>
                            <p className="mb-1.5 whitespace-nowrap leading-none">{`${trimDecimals(
                              swap_out_amount,
                              outDecimals
                            )} ${swap_out_symbol}`}</p>
                            <p className="text-xs leading-none text-th-fgd-3">
                              {formatFixedDecimals(swap_out_price_usd, true)}
                              <span className="mx-1 text-th-fgd-4">|</span>
                              {formatFixedDecimals(
                                swap_out_amount * swap_out_price_usd,
                                true
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col text-right">
                        <p>{borrowAmount}</p>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col text-right">
                        <p>${borrowFee}</p>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col text-right">
                        <a
                          className="text-th-primary"
                          href={`https://explorer.solana.com/tx/${signature}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLinkIcon className="h-5 w-5 text-th-fgd-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="mt-4 space-y-2">
            {tradeHistory.map((h) => {
              const {
                block_datetime,
                signature,
                swap_in_amount,
                swap_in_loan,
                swap_in_loan_origination_fee,
                swap_in_price_usd,
                swap_in_symbol,
                swap_out_amount,
                loan,
                loan_origination_fee,
                swap_out_price_usd,
                swap_out_symbol,
              } = h

              const borrowAmount =
                swap_in_loan > 0
                  ? `${trimDecimals(
                      swap_in_loan,
                      countLeadingZeros(swap_in_loan) + 2
                    )} ${swap_in_symbol}`
                  : loan > 0
                  ? `${trimDecimals(
                      loan,
                      countLeadingZeros(loan) + 2
                    )} ${swap_out_symbol}`
                  : 0
              const borrowFee =
                swap_in_loan_origination_fee > 0
                  ? swap_in_loan_origination_fee.toFixed(4)
                  : loan_origination_fee > 0
                  ? loan_origination_fee.toFixed(4)
                  : 0
              return (
                <div
                  key={signature}
                  className="rounded-md border border-th-bkg-4 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex w-1/2 items-center">
                        <div className="mr-2 flex flex-shrink-0 items-center">
                          <Image
                            alt=""
                            width="24"
                            height="24"
                            src={`/icons/${swap_in_symbol.toLowerCase()}.svg`}
                          />
                        </div>
                        <div>
                          <p className="mb-1.5 whitespace-nowrap leading-none text-th-fgd-1">{`${swap_in_amount.toFixed(
                            2
                          )} ${swap_in_symbol}`}</p>
                          <p className="text-xs leading-none text-th-fgd-3">
                            {formatFixedDecimals(swap_in_price_usd, true)}
                            <span className="mx-1 text-th-fgd-4">|</span>
                            {formatFixedDecimals(
                              swap_in_amount * swap_in_price_usd,
                              true
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="">
                        <ArrowRightIcon className="h-4 w-4 flex-shrink-0 text-th-fgd-4" />
                      </div>
                      <div className="flex w-1/2 items-center">
                        <div className="mr-2 flex flex-shrink-0 items-center">
                          <Image
                            alt=""
                            width="24"
                            height="24"
                            src={`/icons/${swap_out_symbol.toLowerCase()}.svg`}
                          />
                        </div>
                        <div>
                          <p className="mb-1.5 whitespace-nowrap leading-none text-th-fgd-1">{`${swap_out_amount.toFixed(
                            2
                          )} ${swap_out_symbol}`}</p>
                          <p className="text-xs leading-none text-th-fgd-3">
                            {formatFixedDecimals(swap_out_price_usd, true)}
                            <span className="mx-1 text-th-fgd-4">|</span>
                            {formatFixedDecimals(
                              swap_out_amount * swap_out_price_usd,
                              true
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                    <IconButton
                      onClick={() => handleShowTradeDetails(signature)}
                    >
                      <ChevronDownIcon
                        className={`${
                          showTradeDetails === signature
                            ? 'rotate-180'
                            : 'rotate-360'
                        } h-6 w-6 flex-shrink-0 text-th-fgd-1`}
                      />
                    </IconButton>
                  </div>
                  <Transition
                    appear={true}
                    show={showTradeDetails === signature}
                    as={Fragment}
                    enter="transition ease-in duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="transition ease-out"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <div className="mt-4 grid grid-cols-2 gap-4 border-t border-th-bkg-3 pt-4">
                      <div className="col-span-1">
                        <p className="text-xs text-th-fgd-3">{t('date')}</p>
                        <p className="text-th-fgd-1">
                          {dayjs(block_datetime).format('ddd D MMM')}
                        </p>
                        <p className="text-xs text-th-fgd-3">
                          {dayjs(block_datetime).format('h:mma')}
                        </p>
                      </div>
                      <div className="col-span-1">
                        <p className="text-xs text-th-fgd-3">{t('borrow')}</p>
                        <p className="text-th-fgd-1">{borrowAmount}</p>
                      </div>
                      <div className="col-span-1">
                        <p className="text-xs text-th-fgd-3">
                          {t('borrow-fee')}
                        </p>
                        <p className="text-th-fgd-1">${borrowFee}</p>
                      </div>
                      <div className="col-span-1">
                        <p className="text-xs text-th-fgd-3">
                          {t('transaction')}
                        </p>
                        <p className="text-th-fgd-1">
                          <a
                            className="text-th-primary"
                            href={`https://solscan.io/tx/${signature}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View on Solscan
                          </a>
                        </p>
                      </div>
                    </div>
                  </Transition>
                </div>
              )
            })}
          </div>
        )
      ) : (
        <div className="mt-8 flex flex-col items-center rounded-md border border-th-bkg-3 p-8">
          <ClockIcon className="mb-2 h-6 w-6 text-th-fgd-4" />
          <p>No trade history found...</p>
        </div>
      )
    ) : (
      <div className="mt-8 space-y-2">
        <SheenLoader>
          <div className="h-8 w-full rounded bg-th-bkg-2" />
        </SheenLoader>
        <SheenLoader>
          <div className="h-16 w-full rounded bg-th-bkg-2" />
        </SheenLoader>
        <SheenLoader>
          <div className="h-16 w-full rounded bg-th-bkg-2" />
        </SheenLoader>
        <SheenLoader>
          <div className="h-16 w-full rounded bg-th-bkg-2" />
        </SheenLoader>
      </div>
    )
  ) : (
    <div className="mt-8 flex flex-col items-center rounded-md border border-th-bkg-3 p-8">
      <LinkIcon className="mb-2 h-6 w-6 text-th-fgd-4" />
      <p>Connect to view your trade history</p>
    </div>
  )
}

export default TradeHistoryTable
