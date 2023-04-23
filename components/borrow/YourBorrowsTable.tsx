import { Bank, Group } from '@blockworks-foundation/mango-v4'
import useJupiterMints from 'hooks/useJupiterMints'
import {
  ArrowDownRightIcon,
  ArrowUpLeftIcon,
  ChevronDownIcon,
  NoSymbolIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/20/solid'
import useMangoAccount from 'hooks/useMangoAccount'
import { useViewport } from 'hooks/useViewport'
import { useTranslation } from 'next-i18next'
import Image from 'next/legacy/image'
import { formatNumericValue } from 'utils/numbers'
import { breakpoints } from 'utils/theme'
import { Table, Td, Th, TrBody, TrHead } from '../shared/TableElements'
import useMangoGroup from 'hooks/useMangoGroup'
import ConnectEmptyState from '../shared/ConnectEmptyState'
import { useWallet } from '@solana/wallet-adapter-react'
import Decimal from 'decimal.js'
import Button, { IconButton } from '@components/shared/Button'
import { useCallback, useState } from 'react'
import BorrowRepayModal from '@components/modals/BorrowRepayModal'
import Tooltip from '@components/shared/Tooltip'
import BankAmountWithValue from '@components/shared/BankAmountWithValue'
import { BankWithBalance } from 'hooks/useBanksWithBalances'
import { Disclosure, Transition } from '@headlessui/react'

export const getAvailableToBorrow = (
  bankWithBal: BankWithBalance,
  group: Group
) => {
  const { balance, bank, maxBorrow } = bankWithBal
  const { mint, mintDecimals, minVaultToDepositsRatio } = bankWithBal.bank
  const deposits = bank.uiDeposits()

  const availableVaultBalance =
    group.getTokenVaultBalanceByMintUi(mint) -
    deposits * minVaultToDepositsRatio

  const availableAccountBorrow = balance > 0 ? maxBorrow - balance : maxBorrow

  const available = Decimal.min(
    availableAccountBorrow.toFixed(bank.mintDecimals),
    Decimal.max(0, availableVaultBalance.toFixed(mintDecimals))
  )
  return available
}

const YourBorrowsTable = ({ banks }: { banks: BankWithBalance[] }) => {
  const { t } = useTranslation(['common', 'trade'])
  const [showBorrowModal, setShowBorrowModal] = useState(false)
  const [showRepayModal, setShowRepayModal] = useState(false)
  const [selectedToken, setSelectedToken] = useState('')
  const { mangoAccount, mangoAccountAddress } = useMangoAccount()
  const { group } = useMangoGroup()
  const { mangoTokens } = useJupiterMints()
  const { width } = useViewport()
  const { connected } = useWallet()
  const showTableView = width ? width > breakpoints.md : false

  const handleShowActionModals = useCallback(
    (token: string, action: 'borrow' | 'repay') => {
      setSelectedToken(token)
      action === 'borrow' ? setShowBorrowModal(true) : setShowRepayModal(true)
    },
    []
  )

  return (
    <>
      {banks?.length ? (
        showTableView ? (
          <Table>
            <thead>
              <TrHead>
                <Th className="text-left">{t('token')}</Th>
                <Th className="text-right">{t('borrow:borrowed-amount')}</Th>
                <Th>
                  <div className="flex justify-end">
                    <Tooltip content={t('borrow:tooltip-available')}>
                      <span className="tooltip-underline">
                        {t('available')}
                      </span>
                    </Tooltip>
                  </div>
                </Th>
                <Th className="text-right">{t('rate')}</Th>
                <Th />
              </TrHead>
            </thead>
            <tbody>
              {banks.map((b) => {
                const bank: Bank = b.bank

                let logoURI
                if (mangoTokens.length) {
                  logoURI = mangoTokens.find(
                    (t) => t.address === bank.mint.toString()
                  )?.logoURI
                }

                const available = group
                  ? getAvailableToBorrow(b, group)
                  : new Decimal(0)

                const borrowedAmount = b.borrowedAmount

                return (
                  <TrBody key={bank.name} className="text-sm">
                    <Td>
                      <div className="flex items-center">
                        <div className="mr-2.5 flex flex-shrink-0 items-center">
                          {logoURI ? (
                            <Image
                              alt=""
                              width="20"
                              height="20"
                              src={logoURI}
                            />
                          ) : (
                            <QuestionMarkCircleIcon className="h-7 w-7 text-th-fgd-3" />
                          )}
                        </div>
                        <span>{bank.name}</span>
                      </div>
                    </Td>
                    <Td className="text-right">
                      <BankAmountWithValue
                        amount={borrowedAmount}
                        bank={bank}
                        stacked
                      />
                    </Td>
                    <Td className="text-right">
                      <BankAmountWithValue
                        amount={available}
                        bank={bank}
                        stacked
                      />
                    </Td>
                    <Td className="text-right text-th-down">
                      {formatNumericValue(bank.getBorrowRateUi(), 2)}%
                    </Td>
                    <Td>
                      <div className="flex items-center justify-end space-x-2">
                        <Tooltip content={`${t('repay')} ${bank.name}`}>
                          <IconButton
                            onClick={() =>
                              handleShowActionModals(bank.name, 'repay')
                            }
                            size="small"
                          >
                            <ArrowDownRightIcon className="h-5 w-5" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip content={`${t('borrow')} ${bank.name}`}>
                          <IconButton
                            disabled={available.eq(0)}
                            onClick={() =>
                              handleShowActionModals(bank.name, 'borrow')
                            }
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
              const bank: Bank = b.bank

              let logoURI: string | undefined
              if (mangoTokens.length) {
                logoURI = mangoTokens.find(
                  (t) => t.address === bank.mint.toString()
                )?.logoURI
              }

              const available = group
                ? getAvailableToBorrow(b, group)
                : new Decimal(0)

              const borrowedAmount = mangoAccount
                ? Math.abs(mangoAccount.getTokenBalanceUi(bank))
                : 0

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
                                {t('borrow:borrowed-amount')}
                              </p>
                              <BankAmountWithValue
                                amount={borrowedAmount}
                                bank={bank}
                              />
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
                                {t('rate')}
                              </p>
                              <p className="font-mono text-th-down">
                                {formatNumericValue(bank.getBorrowRateUi(), 2)}%
                              </p>
                            </div>
                            <div className="col-span-1">
                              <p className="text-xs text-th-fgd-3">
                                {t('available')}
                              </p>
                              <BankAmountWithValue
                                amount={available}
                                bank={bank}
                              />
                            </div>
                            <Button
                              className="col-span-1 flex items-center justify-center"
                              disabled={!mangoAccount}
                              onClick={() =>
                                handleShowActionModals(bank.name, 'repay')
                              }
                              secondary
                            >
                              <ArrowDownRightIcon className="mr-2 h-5 w-5" />
                              {`${t('repay')} ${bank.name.split(' ')[0]}`}
                            </Button>
                            <Button
                              className="col-span-1 flex items-center justify-center"
                              onClick={() =>
                                handleShowActionModals(bank.name, 'borrow')
                              }
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
        )
      ) : mangoAccountAddress || connected ? (
        <div className="border-b border-th-bkg-3">
          <div className="flex flex-col items-center p-8">
            <NoSymbolIcon className="mb-2 h-6 w-6 text-th-fgd-4" />
            <p>{t('borrow:no-borrows')}</p>
          </div>
        </div>
      ) : (
        <div className="border-b border-th-bkg-3">
          <div className="p-8">
            <ConnectEmptyState text={t('borrow:connect-borrows')} />
          </div>
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

export default YourBorrowsTable
