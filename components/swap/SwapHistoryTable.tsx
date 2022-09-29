import { Fragment, useState } from 'react'
import {
  ArrowRightIcon,
  ChevronDownIcon,
  ClockIcon,
  ArrowTopRightOnSquareIcon,
  LinkIcon,
} from '@heroicons/react/20/solid'
import dayjs from 'dayjs'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import { breakpoints } from '../../utils/theme'
import { useViewport } from '../../hooks/useViewport'
import { IconButton } from '../shared/Button'
import { Transition } from '@headlessui/react'
import SheenLoader from '../shared/SheenLoader'
import { useWallet } from '@solana/wallet-adapter-react'
import { SwapHistoryItem } from '@store/mangoStore'
import {
  countLeadingZeros,
  formatFixedDecimals,
  trimDecimals,
} from '../../utils/numbers'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { PREFERRED_EXPLORER_KEY } from 'utils/constants'
import { EXPLORERS } from 'pages/settings'
import Tooltip from '@components/shared/Tooltip'

const SwapHistoryTable = ({
  swapHistory,
  loading,
}: {
  swapHistory: Array<SwapHistoryItem>
  loading: boolean
}) => {
  const { t } = useTranslation(['common', 'settings'])
  const { connected } = useWallet()
  const [showSwapDetails, setSwapDetails] = useState('')
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false
  const [preferredExplorer] = useLocalStorageState(
    PREFERRED_EXPLORER_KEY,
    EXPLORERS[0]
  )

  const handleShowSwapDetails = (signature: string) => {
    showSwapDetails ? setSwapDetails('') : setSwapDetails(signature)
  }

  return connected ? (
    !loading ? (
      swapHistory.length ? (
        showTableView ? (
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="text-left">{t('date')}</th>
                <th className="w-1/3 text-left">{t('swap')}</th>
                <th className="text-right">{t('borrow')}</th>
                <th className="text-right">{t('borrow-fee')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {swapHistory.map((h, index) => {
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
                    ? `${trimDecimals(loan, countLeadingZeros(loan) + 2)}`
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
                      <p className="font-body tracking-wide">
                        {dayjs(block_datetime).format('ddd D MMM')}
                      </p>
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
                            <p className="mb-1.5 whitespace-nowrap leading-none">
                              {`${trimDecimals(swap_in_amount, inDecimals)}`}
                              <span className="ml-1 font-body tracking-wide">
                                {swap_in_symbol}
                              </span>
                            </p>
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
                            <p className="mb-1.5 whitespace-nowrap leading-none">
                              {`${trimDecimals(swap_out_amount, outDecimals)}`}
                              <span className="ml-1 font-body tracking-wide">
                                {swap_out_symbol}
                              </span>
                            </p>
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
                        <p>
                          {borrowAmount}
                          <span className="ml-1 font-body tracking-wide">
                            {swap_in_symbol}
                          </span>
                        </p>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col text-right">
                        <p>${borrowFee}</p>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center justify-end">
                        <Tooltip
                          content={`View on ${t(
                            `settings:${preferredExplorer.name}`
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
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div>
            {swapHistory.map((h) => {
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
                loan > 0
                  ? `${trimDecimals(loan, countLeadingZeros(loan) + 2)}`
                  : 0
              const borrowFee =
                swap_in_loan_origination_fee > 0
                  ? swap_in_loan_origination_fee.toFixed(4)
                  : loan_origination_fee > 0
                  ? loan_origination_fee.toFixed(4)
                  : 0
              return (
                <div key={signature} className="border-b border-th-bkg-3 p-4">
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
                          <p className="mb-1.5 whitespace-nowrap font-mono leading-none text-th-fgd-1">
                            {swap_in_amount.toFixed(2)}{' '}
                            <span className="font-body">{swap_in_symbol}</span>
                          </p>
                          <p className="font-mono text-xs leading-none text-th-fgd-3">
                            {formatFixedDecimals(swap_in_price_usd, true)}
                            <span className="mx-1 font-body text-th-fgd-4">
                              |
                            </span>
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
                          <p className="mb-1.5 whitespace-nowrap leading-none text-th-fgd-1">
                            {swap_out_amount.toFixed(2)}{' '}
                            <span className="font-body">{swap_out_symbol}</span>
                          </p>
                          <p className="font-mono text-xs leading-none text-th-fgd-3">
                            {formatFixedDecimals(swap_out_price_usd, true)}
                            <span className="mx-1 font-body text-th-fgd-4">
                              |
                            </span>
                            {formatFixedDecimals(
                              swap_out_amount * swap_out_price_usd,
                              true
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                    <IconButton
                      onClick={() => handleShowSwapDetails(signature)}
                    >
                      <ChevronDownIcon
                        className={`${
                          showSwapDetails === signature
                            ? 'rotate-180'
                            : 'rotate-360'
                        } h-6 w-6 flex-shrink-0 text-th-fgd-1`}
                      />
                    </IconButton>
                  </div>
                  <Transition
                    appear={true}
                    show={showSwapDetails === signature}
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
                        <p className="font-mono text-th-fgd-1">
                          {borrowAmount}{' '}
                          <span className="font-body">{swap_in_symbol}</span>
                        </p>
                      </div>
                      <div className="col-span-1">
                        <p className="text-xs text-th-fgd-3">
                          {t('borrow-fee')}
                        </p>
                        <p className="font-mono text-th-fgd-1">${borrowFee}</p>
                      </div>
                      <div className="col-span-1">
                        <p className="text-xs text-th-fgd-3">
                          {t('transaction')}
                        </p>
                        <a
                          className="default-transition flex items-center text-th-fgd-1 hover:text-th-fgd-3"
                          href={`${preferredExplorer.url}${signature}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Image
                            alt=""
                            width="20"
                            height="20"
                            src={`/explorer-logos/${preferredExplorer.name}.png`}
                          />
                          <span className="ml-1.5 text-base">{`View on ${t(
                            `settings:${preferredExplorer.name}`
                          )}`}</span>
                        </a>
                      </div>
                    </div>
                  </Transition>
                </div>
              )
            })}
          </div>
        )
      ) : (
        <div className="flex flex-col items-center p-8">
          <ClockIcon className="mb-2 h-6 w-6 text-th-fgd-4" />
          <p>No swap history found...</p>
        </div>
      )
    ) : (
      <div className="mt-8 space-y-2">
        {[...Array(4)].map((i) => (
          <SheenLoader className="flex flex-1" key={i}>
            <div className="h-8 w-full rounded bg-th-bkg-2" />
          </SheenLoader>
        ))}
      </div>
    )
  ) : (
    <div className="flex flex-col items-center p-8">
      <LinkIcon className="mb-2 h-6 w-6 text-th-fgd-4" />
      <p>Connect to view your swap history</p>
    </div>
  )
}

export default SwapHistoryTable
