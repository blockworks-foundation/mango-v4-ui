import {
  ArrowUpLeftIcon,
  ChevronDownIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/20/solid'
import { useTranslation } from 'next-i18next'
import Image from 'next/legacy/image'
import { useCallback, useEffect, useState } from 'react'
import { useViewport } from '../../hooks/useViewport'
import { formatNumericValue } from '../../utils/numbers'
import { breakpoints } from '../../utils/theme'
import Button, { IconButton } from '../shared/Button'
import Tooltip from '@components/shared/Tooltip'
import useJupiterMints from 'hooks/useJupiterMints'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import useMangoGroup from 'hooks/useMangoGroup'
import mangoStore from '@store/mangoStore'
import BorrowRepayModal from '@components/modals/BorrowRepayModal'
import BankAmountWithValue from '@components/shared/BankAmountWithValue'
import useBanksWithBalances from 'hooks/useBanksWithBalances'
import { getAvailableToBorrow } from './YourBorrowsTable'
import { Disclosure, Transition } from '@headlessui/react'

const AssetsBorrowsTable = () => {
  const { t } = useTranslation(['common', 'token'])
  const [showBorrowModal, setShowBorrowModal] = useState(false)
  const [selectedToken, setSelectedToken] = useState('')
  const actions = mangoStore.getState().actions
  const initialStatsLoad = mangoStore((s) => s.tokenStats.initialLoad)
  const { group } = useMangoGroup()
  const { mangoTokens } = useJupiterMints()
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false
  const banks = useBanksWithBalances()

  const handleShowBorrowModal = useCallback((token: string) => {
    setSelectedToken(token)
    setShowBorrowModal(true)
  }, [])

  useEffect(() => {
    if (group && !initialStatsLoad) {
      actions.fetchTokenStats()
    }
  }, [group])

  return (
    <>
      {showTableView ? (
        <Table>
          <thead>
            <TrHead>
              <Th className="text-left">{t('token')}</Th>
              <Th className="text-right">{t('total-borrows')}</Th>
              <Th>
                <div className="flex justify-end">
                  <Tooltip content={t('borrow:tooltip-available')}>
                    <span className="tooltip-underline">{t('available')}</span>
                  </Tooltip>
                </div>
              </Th>
              <Th>
                <div className="flex justify-end">{t('rate')}</div>
              </Th>
              <Th />
            </TrHead>
          </thead>
          <tbody>
            {banks.map((b) => {
              const bank = b.bank

              let logoURI
              if (mangoTokens?.length) {
                logoURI = mangoTokens.find(
                  (t) => t.address === bank.mint.toString()
                )?.logoURI
              }
              const borrows = bank.uiBorrows()

              const available = group ? getAvailableToBorrow(b, group) : 0

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
                  <Td>
                    <div className="flex flex-col text-right">
                      <BankAmountWithValue
                        amount={borrows}
                        bank={bank}
                        stacked
                      />
                    </div>
                  </Td>
                  <Td>
                    <div className="flex flex-col text-right">
                      <BankAmountWithValue
                        amount={available > 0 ? available : 0}
                        bank={bank}
                        stacked
                      />
                    </div>
                  </Td>
                  <Td>
                    <p className="text-right text-th-down">
                      {formatNumericValue(bank.getBorrowRateUi(), 2)}%
                    </p>
                  </Td>
                  <Td>
                    <div className="flex justify-end">
                      <Tooltip content={`${t('borrow')} ${bank.name}`}>
                        <IconButton
                          disabled={b.maxBorrow === 0}
                          onClick={() => handleShowBorrowModal(bank.name)}
                          size="small"
                        >
                          <ArrowUpLeftIcon className="h-5 w-5" />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </Td>
                </TrBody>
              )
            })}
          </tbody>
        </Table>
      ) : (
        <div className="border-b border-th-bkg-3">
          {banks.map((b) => {
            const bank = b.bank
            let logoURI: string | undefined
            if (mangoTokens?.length) {
              logoURI = mangoTokens.find(
                (t) => t.address === bank.mint.toString()
              )?.logoURI
            }

            const available = group ? getAvailableToBorrow(b, group) : 0

            return (
              <Disclosure key={bank.name}>
                {({ open }) => (
                  <>
                    <Disclosure.Button
                      className={`w-full border-t border-th-bkg-3 p-4 text-left first:border-t-0 focus:outline-none`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="mr-2.5 flex flex-shrink-0 items-center">
                            {logoURI ? (
                              <Image
                                alt=""
                                width="24"
                                height="24"
                                src={logoURI}
                              />
                            ) : (
                              <QuestionMarkCircleIcon className="h-7 w-7 text-th-fgd-3" />
                            )}
                          </div>
                          <p className="text-th-fgd-1">{bank.name}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="mb-0.5 text-right text-xs">
                              {t('rate')}
                            </p>
                            <p className="text-right text-th-down">
                              {formatNumericValue(bank.getBorrowRateUi(), 2)}%
                            </p>
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
                        <div className="mx-4 grid grid-cols-2 gap-4 border-t border-th-bkg-3 pt-4 pb-4">
                          <div className="col-span-1">
                            <p className="text-xs text-th-fgd-3">
                              {t('available')}
                            </p>
                            <BankAmountWithValue
                              amount={available > 0 ? available : 0}
                              bank={bank}
                            />
                          </div>
                          <Button
                            className="col-span-2 flex items-center justify-center"
                            onClick={() => handleShowBorrowModal(bank.name)}
                            secondary
                          >
                            <ArrowUpLeftIcon className="mr-2 h-5 w-5" />
                            {`${t('borrow')} ${bank.name.split(' ')[0]}`}
                          </Button>
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
      {showBorrowModal ? (
        <BorrowRepayModal
          action="borrow"
          isOpen={showBorrowModal}
          onClose={() => setShowBorrowModal(false)}
          token={selectedToken}
        />
      ) : null}
    </>
  )
}

export default AssetsBorrowsTable
