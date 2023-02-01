import { Bank } from '@blockworks-foundation/mango-v4'
import useJupiterMints from 'hooks/useJupiterMints'
import {
  ArrowDownRightIcon,
  ArrowUpLeftIcon,
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
import { getMaxWithdrawForBank } from '@components/swap/useTokenMax'
import { IconButton } from '@components/shared/Button'
import { useCallback, useState } from 'react'
import BorrowRepayModal from '@components/modals/BorrowRepayModal'
import Tooltip from '@components/shared/Tooltip'
import BankAmountWithValue from '@components/shared/BankAmountWithValue'
import { BankWithBalance } from 'hooks/useBanksWithBalances'

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

                const available = b.maxBorrow

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
                            disabled={available === 0}
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
          banks.map((b) => {
            const bank: Bank = b.bank

            let logoURI
            if (mangoTokens.length) {
              logoURI = mangoTokens.find(
                (t) => t.address === bank.mint.toString()
              )?.logoURI
            }

            const available =
              group && mangoAccount
                ? getMaxWithdrawForBank(group, bank, mangoAccount, true)
                : new Decimal(0)

            const borrowedAmount = mangoAccount
              ? Math.abs(mangoAccount.getTokenBalanceUi(bank))
              : 0

            return (
              <div
                key={bank.name}
                className="border-b border-th-bkg-3 px-6 py-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-2.5 flex flex-shrink-0 items-center">
                      {logoURI ? (
                        <Image alt="" width="24" height="24" src={logoURI} />
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
                    <div>
                      <p className="mb-0.5 text-right text-xs">{t('rate')}</p>
                      <p className="text-right text-th-down">
                        {formatNumericValue(bank.getBorrowRateUi(), 2)}%
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Tooltip content={`${t('repay')} ${bank.name}`}>
                        <IconButton
                          onClick={() =>
                            handleShowActionModals(bank.name, 'repay')
                          }
                          size="medium"
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
                          size="medium"
                        >
                          <ArrowUpLeftIcon className="h-5 w-5" />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
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
