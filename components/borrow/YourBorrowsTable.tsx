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
import { formatDecimal, formatFixedDecimals } from 'utils/numbers'
import { breakpoints } from 'utils/theme'
import { Table, Td, Th, TrBody, TrHead } from '../shared/TableElements'
import useMangoGroup from 'hooks/useMangoGroup'
import AmountWithValue from '../shared/AmountWithValue'
import ConnectEmptyState from '../shared/ConnectEmptyState'
import { useWallet } from '@solana/wallet-adapter-react'
import Decimal from 'decimal.js'
import { getMaxWithdrawForBank } from '@components/swap/useTokenMax'
import { IconButton } from '@components/shared/Button'
import { useCallback, useState } from 'react'
import BorrowRepayModal from '@components/modals/BorrowRepayModal'
import Tooltip from '@components/shared/Tooltip'

interface BankWithBalance {
  balance: number
  bank: Bank
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

                const available =
                  group && mangoAccount
                    ? getMaxWithdrawForBank(group, bank, mangoAccount, true)
                    : new Decimal(0)

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
                      {mangoAccount ? (
                        <AmountWithValue
                          amount={formatDecimal(
                            mangoAccount.getTokenBalanceUi(bank),
                            bank.mintDecimals
                          )}
                          value={formatFixedDecimals(
                            mangoAccount.getTokenBalanceUi(bank) * bank.uiPrice,
                            true
                          )}
                          stacked
                        />
                      ) : (
                        <AmountWithValue amount={0} value={'0'} />
                      )}
                    </Td>
                    <Td className="text-right">
                      <AmountWithValue
                        amount={formatDecimal(
                          available.toNumber(),
                          bank.mintDecimals
                        )}
                        value={formatFixedDecimals(
                          available.toNumber() * bank.uiPrice,
                          true
                        )}
                        stacked
                      />
                    </Td>
                    <Td className="text-right text-th-down">
                      {formatDecimal(bank.getBorrowRateUi(), 2, {
                        fixed: true,
                      })}
                      %
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
          <>
            {/* {banks.map(({ key, value }) => {
          const bank = value[0]

          let logoURI
          if (mangoTokens.length) {
            logoURI = mangoTokens.find(
              (t) => t.address === bank.mint.toString()
            )?.logoURI
          }

          const inOrders = spotBalances[bank.mint.toString()]?.inOrders || 0
          const unsettled = spotBalances[bank.mint.toString()]?.unsettled || 0

          return (
            <div
              className="flex items-center justify-between border-b border-th-bkg-3 p-4"
              key={key}
            >
              <div className="flex items-center">
                <div className="mr-2.5 flex flex-shrink-0 items-center">
                  {logoURI ? (
                    <Image alt="" width="20" height="20" src={logoURI} />
                  ) : (
                    <QuestionMarkCircleIcon className="h-7 w-7 text-th-fgd-3" />
                  )}
                </div>
                <span>{bank.name}</span>
              </div>
              <div className="text-right">
                <div className="mb-0.5 flex justify-end space-x-1.5">
                  <span className="text-sm text-th-fgd-4">
                    {mangoAccount
                      ? `${formatFixedDecimals(
                          mangoAccount.getTokenBalanceUi(bank) * bank.uiPrice,
                          false,
                          true
                        )}`
                      : '$0.00'}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <p className="text-xs text-th-fgd-4">
                    {t('trade:in-orders')}:{' '}
                    <span className="font-mono text-th-fgd-3">{inOrders}</span>
                  </p>
                  <p className="text-xs text-th-fgd-4">
                    {t('trade:unsettled')}:{' '}
                    <span className="font-mono text-th-fgd-3">
                      {unsettled ? unsettled.toFixed(bank.mintDecimals) : 0}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )
        })} */}
          </>
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
