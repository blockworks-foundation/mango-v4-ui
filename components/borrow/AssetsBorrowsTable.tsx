import { ArrowUpLeftIcon, ChevronDownIcon } from '@heroicons/react/20/solid'
import { useTranslation } from 'next-i18next'
import { useCallback, useMemo, useState } from 'react'
import { useViewport } from '../../hooks/useViewport'
import { formatNumericValue } from '../../utils/numbers'
import { breakpoints } from '../../utils/theme'
import Button, { IconButton } from '../shared/Button'
import Tooltip from '@components/shared/Tooltip'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import useMangoGroup from 'hooks/useMangoGroup'
import BorrowRepayModal from '@components/modals/BorrowRepayModal'
import BankAmountWithValue from '@components/shared/BankAmountWithValue'
import useBanksWithBalances from 'hooks/useBanksWithBalances'
import { getAvailableToBorrow } from './YourBorrowsTable'
import { Disclosure, Transition } from '@headlessui/react'
import { TOKEN_REDUCE_ONLY_OPTIONS } from 'utils/constants'
import TableTokenName from '@components/shared/TableTokenName'

const AssetsBorrowsTable = () => {
  const { t } = useTranslation(['common', 'token'])
  const [showBorrowModal, setShowBorrowModal] = useState(false)
  const [selectedToken, setSelectedToken] = useState('')
  const { group } = useMangoGroup()
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false
  const banks = useBanksWithBalances()

  const banksToShow = useMemo(() => {
    if (!banks || !banks.length) return []
    return banks.filter(
      (b) => b.bank.reduceOnly === TOKEN_REDUCE_ONLY_OPTIONS.DISABLED,
    )
  }, [banks])

  const handleShowBorrowModal = useCallback((token: string) => {
    setSelectedToken(token)
    setShowBorrowModal(true)
  }, [])

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
            {banksToShow.map((b) => {
              const bank = b.bank

              const borrows = bank.uiBorrows()

              const available = group
                ? getAvailableToBorrow(b, group).toNumber()
                : 0

              return (
                <TrBody key={bank.name}>
                  <Td>
                    <TableTokenName bank={bank} symbol={bank.name} />
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
          {banksToShow.map((b) => {
            const bank = b.bank

            const available = group
              ? getAvailableToBorrow(b, group).toNumber()
              : 0

            return (
              <Disclosure key={bank.name}>
                {({ open }) => (
                  <>
                    <Disclosure.Button
                      className={`w-full border-t border-th-bkg-3 p-4 text-left first:border-t-0 focus:outline-none`}
                    >
                      <div className="flex items-center justify-between">
                        <TableTokenName bank={bank} symbol={bank.name} />
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="mb-0.5 text-right text-xs">
                              {t('rate')}
                            </p>
                            <p className="text-right font-mono text-th-down">
                              {formatNumericValue(bank.getBorrowRateUi(), 2)}%
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
