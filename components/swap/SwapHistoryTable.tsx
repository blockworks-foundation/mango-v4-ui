import { Fragment, useEffect, useState } from 'react'
import {
  ArrowRightIcon,
  ChevronDownIcon,
  NoSymbolIcon,
} from '@heroicons/react/20/solid'
import dayjs from 'dayjs'
import { useTranslation } from 'next-i18next'
import Image from 'next/legacy/image'
import { breakpoints } from '../../utils/theme'
import { useViewport } from '../../hooks/useViewport'
import { IconButton } from '../shared/Button'
import { Transition } from '@headlessui/react'
import SheenLoader from '../shared/SheenLoader'
import mangoStore from '@store/mangoStore'
import {
  countLeadingZeros,
  formatDecimal,
  formatFixedDecimals,
  trimDecimals,
} from '../../utils/numbers'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { PREFERRED_EXPLORER_KEY } from 'utils/constants'
import Tooltip from '@components/shared/Tooltip'
import { formatTokenSymbol } from 'utils/tokens'
import useJupiterMints from 'hooks/useJupiterMints'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import { EXPLORERS } from '@components/settings/PreferredExplorerSettings'
import useMangoAccount from 'hooks/useMangoAccount'
import { useWallet } from '@solana/wallet-adapter-react'

const SwapHistoryTable = () => {
  const { t } = useTranslation(['common', 'settings', 'swap'])
  const swapHistory = mangoStore((s) => s.mangoAccount.stats.swapHistory.data)
  const initialLoad = mangoStore(
    (s) => s.mangoAccount.stats.swapHistory.initialLoad
  )
  const { connected } = useWallet()
  const { mangoTokens } = useJupiterMints()
  const [showSwapDetails, setSwapDetails] = useState('')
  const actions = mangoStore.getState().actions
  const { mangoAccountAddress } = useMangoAccount()
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false
  const [preferredExplorer] = useLocalStorageState(
    PREFERRED_EXPLORER_KEY,
    EXPLORERS[0]
  )

  useEffect(() => {
    if (mangoAccountAddress) {
      actions.fetchSwapHistory(mangoAccountAddress)
    }
  }, [actions, mangoAccountAddress])

  const handleShowSwapDetails = (signature: string) => {
    showSwapDetails ? setSwapDetails('') : setSwapDetails(signature)
  }

  return mangoAccountAddress && swapHistory.length ? (
    showTableView ? (
      <Table>
        <thead>
          <TrHead>
            <Th className="text-left">{t('date')}</Th>
            <Th className="text-left">{t('swap:paid')}</Th>
            <Th className="text-left">{t('swap:received')}</Th>
            <Th className="text-right">{t('value')}</Th>
            <Th className="text-right">{t('borrow')}</Th>
            <Th className="text-right">{t('borrow-fee')}</Th>
            <Th />
          </TrHead>
        </thead>
        <tbody>
          {swapHistory.map((h) => {
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

            let baseLogoURI
            let quoteLogoURI

            const inSymbol = formatTokenSymbol(swap_in_symbol)
            const outSymbol = formatTokenSymbol(swap_out_symbol)
            console.log('mangoTokens', mangoTokens)

            if (mangoTokens.length) {
              baseLogoURI = mangoTokens.find(
                (t) => t.symbol.toUpperCase() === inSymbol.toUpperCase()
              )?.logoURI
              quoteLogoURI = mangoTokens.find(
                (t) => t.symbol.toUpperCase() === outSymbol.toUpperCase()
              )?.logoURI
            }

            const inDecimals = countLeadingZeros(swap_in_amount) + 2
            const outDecimals = countLeadingZeros(swap_out_amount) + 2
            return (
              <TrBody key={signature}>
                <Td>
                  <p className="font-body">
                    {dayjs(block_datetime).format('ddd D MMM')}
                  </p>
                  <p className="font-body text-xs text-th-fgd-3">
                    {dayjs(block_datetime).format('h:mma')}
                  </p>
                </Td>
                <Td>
                  <div className="flex items-center">
                    <div className="mr-2.5 flex flex-shrink-0 items-center">
                      <Image
                        alt=""
                        width="24"
                        height="24"
                        src={baseLogoURI || ''}
                      />
                    </div>
                    <div>
                      <p className="whitespace-nowrap">
                        {`${formatDecimal(swap_in_amount, inDecimals)}`}
                        <span className="ml-1 font-body text-th-fgd-3">
                          {inSymbol}
                        </span>
                      </p>
                      <p className="text-xs text-th-fgd-3">
                        <span className="font-body text-th-fgd-4">
                          {t('price')}:
                        </span>{' '}
                        {formatFixedDecimals(swap_in_price_usd, true)}
                      </p>
                    </div>
                  </div>
                </Td>
                <Td>
                  <div className="flex items-center">
                    <div className="mr-2.5 flex flex-shrink-0 items-center">
                      <Image
                        alt=""
                        width="24"
                        height="24"
                        src={quoteLogoURI || ''}
                      />
                    </div>
                    <div>
                      <p className="whitespace-nowrap">
                        {`${formatDecimal(swap_out_amount, outDecimals)}`}
                        <span className="ml-1 font-body text-th-fgd-3">
                          {outSymbol}
                        </span>
                      </p>
                      <p className="text-xs text-th-fgd-4">
                        <span className="font-body">{t('price')}:</span>{' '}
                        {formatFixedDecimals(swap_out_price_usd, true)}
                      </p>
                    </div>
                  </div>
                </Td>
                <Td>
                  <p className="text-right">
                    {formatFixedDecimals(
                      swap_out_price_usd * swap_out_amount,
                      false,
                      true
                    )}
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
                </Td>
              </TrBody>
            )
          })}
        </tbody>
      </Table>
    ) : (
      <div>
        {swapHistory.map((h) => {
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
            loan > 0 ? `${trimDecimals(loan, countLeadingZeros(loan) + 2)}` : 0
          const borrowFee =
            swap_in_loan_origination_fee > 0
              ? swap_in_loan_origination_fee.toFixed(4)
              : loan_origination_fee > 0
              ? loan_origination_fee.toFixed(4)
              : 0

          let baseLogoURI
          let quoteLogoURI

          const inSymbol = formatTokenSymbol(swap_in_symbol)
          const outSymbol = formatTokenSymbol(swap_out_symbol)

          if (mangoTokens.length) {
            baseLogoURI = mangoTokens.find(
              (t) => t.symbol.toUpperCase() === inSymbol.toUpperCase()
            )?.logoURI
            quoteLogoURI = mangoTokens.find(
              (t) => t.symbol.toUpperCase() === outSymbol.toUpperCase()
            )?.logoURI
          }

          const inDecimals = countLeadingZeros(swap_in_amount) + 2
          const outDecimals = countLeadingZeros(swap_out_amount) + 2

          return (
            <div key={signature} className="border-b border-th-bkg-3 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-2 flex flex-shrink-0 items-center">
                      <Image
                        alt=""
                        width="24"
                        height="24"
                        src={baseLogoURI || ''}
                      />
                    </div>
                    <div>
                      <p className="whitespace-nowrap font-mono text-th-fgd-1">
                        {formatDecimal(swap_in_amount, inDecimals)}{' '}
                        <span className="font-body text-th-fgd-3">
                          {inSymbol}
                        </span>
                      </p>
                      <p className="font-mono text-xs text-th-fgd-3">
                        <span className="font-body text-th-fgd-4">
                          {t('price')}:
                        </span>{' '}
                        {formatFixedDecimals(swap_in_price_usd, true)}
                      </p>
                    </div>
                  </div>
                  <ArrowRightIcon className="mx-4 h-4 w-4 flex-shrink-0 text-th-fgd-4" />
                  <div className="flex items-center">
                    <div className="mr-2 flex flex-shrink-0 items-center">
                      <Image
                        alt=""
                        width="24"
                        height="24"
                        src={quoteLogoURI || ''}
                      />
                    </div>
                    <div>
                      <p className="whitespace-nowrap font-mono text-th-fgd-1">
                        {formatDecimal(swap_out_amount, outDecimals)}{' '}
                        <span className="font-body text-th-fgd-3">
                          {outSymbol}
                        </span>
                      </p>
                      <p className="font-mono text-xs text-th-fgd-3">
                        <span className="font-body text-th-fgd-4">
                          {t('price')}:
                        </span>{' '}
                        {formatFixedDecimals(swap_out_price_usd, true)}
                      </p>
                    </div>
                  </div>
                </div>
                <IconButton
                  onClick={() => handleShowSwapDetails(signature)}
                  size="medium"
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
                      <span className="font-body text-th-fgd-3">
                        {inSymbol}
                      </span>
                    </p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-xs text-th-fgd-3">{t('borrow-fee')}</p>
                    <p className="font-mono text-th-fgd-1">${borrowFee}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="mb-0.5 text-xs text-th-fgd-3">
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
                      <span className="ml-1.5">{`View on ${t(
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
  ) : connected && !initialLoad ? (
    <div className="mt-4 space-y-1.5">
      {[...Array(4)].map((x, i) => (
        <SheenLoader className="mx-4 flex flex-1 md:mx-6" key={i}>
          <div className="h-16 w-full bg-th-bkg-2" />
        </SheenLoader>
      ))}
    </div>
  ) : (
    <div className="flex flex-col items-center p-8">
      <NoSymbolIcon className="mb-2 h-6 w-6 text-th-fgd-4" />
      <p>{t('swap:no-history')}</p>
    </div>
  )
}

export default SwapHistoryTable
