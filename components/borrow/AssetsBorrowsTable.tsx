import { Transition } from '@headlessui/react'
import {
  ArrowUpLeftIcon,
  ChevronDownIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/20/solid'
import { useTranslation } from 'next-i18next'
import Image from 'next/legacy/image'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { useViewport } from '../../hooks/useViewport'
import { formatDecimal, formatFixedDecimals } from '../../utils/numbers'
import { breakpoints } from '../../utils/theme'
import Button, { IconButton } from '../shared/Button'
import Tooltip from '@components/shared/Tooltip'
import useJupiterMints from 'hooks/useJupiterMints'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import useMangoGroup from 'hooks/useMangoGroup'
import mangoStore from '@store/mangoStore'
import AmountWithValue from '@components/shared/AmountWithValue'
import { getMaxWithdrawForBank } from '@components/swap/useTokenMax'
import useMangoAccount from 'hooks/useMangoAccount'
import BorrowRepayModal from '@components/modals/BorrowRepayModal'

const AssetsBorrowsTable = () => {
  const { t } = useTranslation(['common', 'token'])
  const [showBorrowModal, setShowBorrowModal] = useState(false)
  const [selectedToken, setSelectedToken] = useState('')
  const actions = mangoStore.getState().actions
  const initialStatsLoad = mangoStore((s) => s.tokenStats.initialLoad)
  const [showTokenDetails, setShowTokenDetails] = useState('')
  const { group } = useMangoGroup()
  const { mangoAccount } = useMangoAccount()
  const { mangoTokens } = useJupiterMints()
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false

  const handleShowBorrowModal = useCallback((token: string) => {
    setSelectedToken(token)
    setShowBorrowModal(true)
  }, [])

  useEffect(() => {
    if (group && !initialStatsLoad) {
      actions.fetchTokenStats()
    }
  }, [group])

  const banks = useMemo(() => {
    if (group) {
      const rawBanks = Array.from(group?.banksMapByName, ([key, value]) => ({
        key,
        value,
      }))
      return rawBanks.sort((a, b) => a.key.localeCompare(b.key))
    }
    return []
  }, [group])

  const handleShowTokenDetails = (name: string) => {
    showTokenDetails ? setShowTokenDetails('') : setShowTokenDetails(name)
  }

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
              {/* <Th>
                <div className="flex justify-end">
                  <Tooltip content="The percentage of deposits that have been lent out.">
                    <span className="tooltip-underline">
                      {t('utilization')}
                    </span>
                  </Tooltip>
                </div>
              </Th> */}
              <Th>
                <div className="flex justify-end text-right">
                  <Tooltip content={t('borrow:liability-weight-desc')}>
                    <span className="tooltip-underline">
                      {t('liability-weight')}
                    </span>
                  </Tooltip>
                </div>
              </Th>
              <Th />
            </TrHead>
          </thead>
          <tbody>
            {banks.map(({ key, value }) => {
              const bank = value[0]

              let logoURI
              if (mangoTokens?.length) {
                logoURI = mangoTokens.find(
                  (t) => t.address === bank.mint.toString()
                )?.logoURI
              }
              const borrows = bank.uiBorrows()
              const price = bank.uiPrice

              const available =
                group && mangoAccount
                  ? getMaxWithdrawForBank(
                      group,
                      bank,
                      mangoAccount,
                      true
                    ).toNumber()
                  : 0

              return (
                <TrBody key={key}>
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
                      <p>{formatFixedDecimals(borrows)}</p>
                      <p className="text-th-fgd-4">
                        {formatFixedDecimals(borrows * price, true, true)}
                      </p>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex flex-col text-right">
                      <p>
                        {available > 0 ? formatFixedDecimals(available) : '0'}
                      </p>
                      <p className="text-th-fgd-4">
                        {available > 0
                          ? formatFixedDecimals(available * price, false, true)
                          : '$0.00'}
                      </p>
                    </div>
                  </Td>
                  <Td>
                    <p className="text-right text-th-down">
                      {formatDecimal(bank.getBorrowRateUi(), 2, {
                        fixed: true,
                      })}
                      %
                    </p>
                  </Td>
                  {/* <Td>
                    <div className="flex flex-col text-right">
                      <p>
                        {bank.uiDeposits() > 0
                          ? formatDecimal(
                              (bank.uiBorrows() / bank.uiDeposits()) * 100,
                              1,
                              { fixed: true }
                            )
                          : '0.0'}
                        %
                      </p>
                    </div>
                  </Td> */}
                  <Td>
                    <div className="flex justify-end space-x-1.5 text-right">
                      <p>{bank.initLiabWeight.toFixed(2)}</p>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex justify-end">
                      <Tooltip content={`${t('borrow')} ${bank.name}`}>
                        <IconButton
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
        <div>
          {banks.map(({ key, value }) => {
            const bank = value[0]
            let logoURI
            if (mangoTokens?.length) {
              logoURI = mangoTokens.find(
                (t) => t.address === bank.mint.toString()
              )?.logoURI
            }
            const borrows = bank.uiBorrows()
            const price = bank.uiPrice

            const available =
              group && mangoAccount
                ? getMaxWithdrawForBank(
                    group,
                    bank,
                    mangoAccount,
                    true
                  ).toNumber()
                : 0

            return (
              <div key={key} className="border-b border-th-bkg-3 px-6 py-4">
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
                        {t('available')}
                      </p>
                      <AmountWithValue
                        amount={formatFixedDecimals(available)}
                        value={formatFixedDecimals(
                          available * price,
                          true,
                          true
                        )}
                      />
                    </div>
                    <div>
                      <p className="mb-0.5 text-right text-xs">{t('rate')}</p>
                      <p className="text-right text-th-down">
                        {formatDecimal(bank.getBorrowRateUi(), 2, {
                          fixed: true,
                        })}
                        %
                      </p>
                    </div>
                    <IconButton
                      onClick={() => handleShowTokenDetails(bank.name)}
                      size="medium"
                    >
                      <ChevronDownIcon
                        className={`${
                          showTokenDetails === bank.name
                            ? 'rotate-180'
                            : 'rotate-360'
                        } h-6 w-6 flex-shrink-0 text-th-fgd-1`}
                      />
                    </IconButton>
                  </div>
                </div>
                <Transition
                  appear={true}
                  show={showTokenDetails === bank.name}
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
                      <p className="mb-0.5 text-xs">{t('total-borrows')}</p>
                      <AmountWithValue
                        amount={formatFixedDecimals(borrows)}
                        value={formatFixedDecimals(borrows * price, true, true)}
                      />
                    </div>
                    {/* <div className="col-span-1">
                      <p className="text-xs text-th-fgd-3">
                        {t('utilization')}
                      </p>
                      <p className="font-mono text-th-fgd-1">
                        {bank.uiDeposits() > 0
                          ? formatDecimal(
                              (bank.uiBorrows() / bank.uiDeposits()) * 100,
                              1,
                              { fixed: true }
                            )
                          : '0.0'}
                        %
                      </p>
                    </div> */}
                    <div className="col-span-1">
                      <Tooltip content={t('borrow:liability-weight-desc')}>
                        <p className="tooltip-underline text-xs text-th-fgd-3">
                          {t('liability-weight')}
                        </p>
                      </Tooltip>
                      <div className="flex space-x-1.5 font-mono">
                        <p className="text-th-fgd-1">
                          {bank.initLiabWeight.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="col-span-1">
                      <Button
                        className="flex items-center"
                        onClick={() => handleShowBorrowModal(bank.name)}
                        secondary
                        size="small"
                      >
                        <ArrowUpLeftIcon className="mr-1.5 h-5 w-5" />
                        {`${t('borrow')} ${bank.name}`}
                      </Button>
                    </div>
                  </div>
                </Transition>
              </div>
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
