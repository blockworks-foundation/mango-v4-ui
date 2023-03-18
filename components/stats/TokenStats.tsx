import { Disclosure, Transition } from '@headlessui/react'
import {
  ChevronDownIcon,
  ChevronRightIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/20/solid'
import { useTranslation } from 'next-i18next'
import Image from 'next/legacy/image'
import { useEffect } from 'react'
import { useViewport } from '../../hooks/useViewport'
import { breakpoints } from '../../utils/theme'
import { LinkButton } from '../shared/Button'
import ContentBox from '../shared/ContentBox'
import Tooltip from '@components/shared/Tooltip'
import { Bank, toUiDecimals } from '@blockworks-foundation/mango-v4'
import { useRouter } from 'next/router'
import useJupiterMints from 'hooks/useJupiterMints'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import useMangoGroup from 'hooks/useMangoGroup'
import mangoStore from '@store/mangoStore'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import BankAmountWithValue from '@components/shared/BankAmountWithValue'
import useBanksWithBalances from 'hooks/useBanksWithBalances'
import Decimal from 'decimal.js'

const TokenStats = () => {
  const { t } = useTranslation(['common', 'token'])
  const actions = mangoStore.getState().actions
  const initialStatsLoad = mangoStore((s) => s.tokenStats.initialLoad)
  const { group } = useMangoGroup()
  const { mangoTokens } = useJupiterMints()
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false
  const router = useRouter()
  const banks = useBanksWithBalances()

  useEffect(() => {
    if (group && !initialStatsLoad) {
      actions.fetchTokenStats()
    }
  }, [group])

  const goToTokenPage = (bank: Bank) => {
    router.push(`/token/${bank.name}`, undefined, { shallow: true })
  }

  return group ? (
    <ContentBox hideBorder hidePadding>
      {showTableView ? (
        <div className="thin-scroll overflow-x-auto">
          <Table>
            <thead>
              <TrHead>
                <Th className="text-left">{t('token')}</Th>
                <Th className="text-right">{t('total-deposits')}</Th>
                <Th className="text-right">{t('total-borrows')}</Th>
                <Th className="text-right">
                  <div className="flex justify-end">
                    <Tooltip content="The amount available to borrow">
                      <span className="tooltip-underline">
                        {t('available')}
                      </span>
                    </Tooltip>
                  </div>
                </Th>
                <Th>
                  <div className="flex justify-end">
                    <Tooltip content="Fees collected for loan originations">
                      <span className="tooltip-underline">{t('fees')}</span>
                    </Tooltip>
                  </div>
                </Th>
                <Th>
                  <div className="flex justify-end">
                    <Tooltip content="The deposit rate (green) will automatically be paid on positive balances and the borrow rate (red) will automatically be charged on negative balances.">
                      <span className="tooltip-underline">{t('rates')}</span>
                    </Tooltip>
                  </div>
                </Th>
                <Th>
                  <div className="flex justify-end">
                    <Tooltip content="The percentage of deposits that have been lent out">
                      <span className="tooltip-underline">
                        {t('utilization')}
                      </span>
                    </Tooltip>
                  </div>
                </Th>
                <Th>
                  <div className="flex justify-end text-right">
                    <Tooltip content={t('asset-liability-weight-desc')}>
                      <span className="tooltip-underline">
                        {t('asset-liability-weight')}
                      </span>
                    </Tooltip>
                  </div>
                </Th>
                <Th />
              </TrHead>
            </thead>
            <tbody>
              {banks.map((b) => {
                const bank: Bank = b.bank

                let logoURI
                if (mangoTokens?.length) {
                  logoURI = mangoTokens.find(
                    (t) => t.address === bank.mint.toString()
                  )?.logoURI
                }
                const deposits = bank.uiDeposits()
                const borrows = bank.uiBorrows()
                const availableVaultBalance =
                  group.getTokenVaultBalanceByMintUi(bank.mint) -
                  deposits * bank.minVaultToDepositsRatio
                const available = Decimal.max(
                  0,
                  availableVaultBalance.toFixed(bank.mintDecimals)
                )
                const feesEarned = toUiDecimals(
                  bank.collectedFeesNative,
                  bank.mintDecimals
                )

                return (
                  <TrBody
                    className="default-transition md:hover:cursor-pointer md:hover:bg-th-bkg-2"
                    key={bank.name}
                    onClick={() => goToTokenPage(bank)}
                  >
                    <Td>
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
                            <QuestionMarkCircleIcon className="h-6 w-6 text-th-fgd-3" />
                          )}
                        </div>
                        <p className="font-body">{bank.name}</p>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex flex-col text-right">
                        <BankAmountWithValue
                          amount={deposits.toFixed(4)}
                          bank={bank}
                          fixDecimals={false}
                          stacked
                        />
                      </div>
                    </Td>
                    <Td>
                      <div className="flex flex-col text-right">
                        <BankAmountWithValue
                          amount={borrows.toFixed(4)}
                          bank={bank}
                          fixDecimals={false}
                          stacked
                        />
                      </div>
                    </Td>
                    <Td>
                      <div className="flex flex-col text-right">
                        <BankAmountWithValue
                          amount={available}
                          bank={bank}
                          fixDecimals={false}
                          stacked
                        />
                      </div>
                    </Td>
                    <Td>
                      <div className="flex flex-col text-right">
                        <BankAmountWithValue
                          amount={feesEarned}
                          bank={bank}
                          fixDecimals={false}
                          stacked
                        />
                      </div>
                    </Td>
                    <Td>
                      <div className="flex justify-end space-x-1.5">
                        <p className="text-th-up">
                          <FormatNumericValue
                            value={bank.getDepositRateUi()}
                            decimals={2}
                          />
                          %
                        </p>
                        <span className="text-th-fgd-4">|</span>
                        <p className="text-th-down">
                          <FormatNumericValue
                            value={bank.getBorrowRateUi()}
                            decimals={2}
                          />
                          %
                        </p>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex flex-col text-right">
                        <p>
                          {bank.uiDeposits() > 0
                            ? (
                                (bank.uiBorrows() / bank.uiDeposits()) *
                                100
                              ).toFixed(1)
                            : '0.0'}
                          %
                        </p>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex justify-end space-x-1.5 text-right">
                        <p>{bank.initAssetWeight.toFixed(2)}</p>
                        <span className="text-th-fgd-4">|</span>
                        <p>{bank.initLiabWeight.toFixed(2)}</p>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex justify-end">
                        <ChevronRightIcon className="h-5 w-5 text-th-fgd-3" />
                      </div>
                    </Td>
                  </TrBody>
                )
              })}
            </tbody>
          </Table>
        </div>
      ) : (
        <div className="border-b border-th-bkg-3">
          {banks.map((b, i) => {
            const bank = b.bank
            let logoURI: string | undefined
            if (mangoTokens?.length) {
              logoURI = mangoTokens.find(
                (t) => t.address === bank.mint.toString()
              )?.logoURI
            }
            const deposits = bank.uiDeposits()
            const borrows = bank.uiBorrows()
            const availableVaultBalance =
              group.getTokenVaultBalanceByMintUi(bank.mint) -
              deposits * bank.minVaultToDepositsRatio
            const available = Decimal.max(
              0,
              availableVaultBalance.toFixed(bank.mintDecimals)
            )
            const feesEarned = toUiDecimals(
              bank.collectedFeesNative,
              bank.mintDecimals
            )
            return (
              <Disclosure key={bank.name}>
                {({ open }) => (
                  <>
                    <Disclosure.Button
                      className={`w-full border-t border-th-bkg-3 px-6 py-4 text-left focus:outline-none ${
                        i === 0 ? 'border-t-0' : ''
                      }`}
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
                        <ChevronDownIcon
                          className={`${
                            open ? 'rotate-180' : 'rotate-360'
                          } h-6 w-6 flex-shrink-0 text-th-fgd-3`}
                        />
                      </div>
                    </Disclosure.Button>
                    <Transition
                      enter="transition ease-in duration-200"
                      enterFrom="opacity-0"
                      enterTo="opacity-100"
                    >
                      <Disclosure.Panel>
                        <div className="mx-6 grid grid-cols-2 gap-4 border-t border-th-bkg-3 pt-4 pb-4">
                          <div className="col-span-1">
                            <p className="mb-0.5 text-xs">
                              {t('total-deposits')}
                            </p>
                            <BankAmountWithValue
                              amount={deposits.toFixed(4)}
                              bank={bank}
                              fixDecimals={false}
                            />
                          </div>
                          <div className="col-span-1">
                            <p className="mb-0.5 text-xs">
                              {t('total-borrows')}
                            </p>
                            <BankAmountWithValue
                              amount={borrows.toFixed(4)}
                              bank={bank}
                              fixDecimals={false}
                            />
                          </div>
                          <div className="col-span-1">
                            <Tooltip content="The amount available to borrow">
                              <p className="tooltip-underline text-xs">
                                {t('available')}
                              </p>
                            </Tooltip>
                            <BankAmountWithValue
                              amount={available}
                              bank={bank}
                              fixDecimals={false}
                            />
                          </div>
                          <div className="col-span-1">
                            <Tooltip content="Fees collected for loan originations">
                              <p className="tooltip-underline text-xs">
                                {t('fees')}
                              </p>
                            </Tooltip>
                            <BankAmountWithValue
                              amount={feesEarned}
                              bank={bank}
                              fixDecimals={false}
                            />
                          </div>
                          <div className="col-span-1">
                            <p className="text-xs">{t('rates')}</p>
                            <p className="space-x-2">
                              <span className="font-mono text-th-up">
                                <FormatNumericValue
                                  value={bank.getDepositRateUi()}
                                  decimals={2}
                                />
                                %
                              </span>
                              <span className="font-normal text-th-fgd-4">
                                |
                              </span>
                              <span className="font-mono text-th-down">
                                <FormatNumericValue
                                  value={bank.getBorrowRateUi()}
                                  decimals={2}
                                />
                                %
                              </span>
                            </p>
                          </div>
                          <div className="col-span-1">
                            <p className="text-xs">{t('utilization')}</p>
                            <p className="font-mono text-th-fgd-1">
                              {bank.uiDeposits() > 0
                                ? (
                                    (bank.uiBorrows() / bank.uiDeposits()) *
                                    100
                                  ).toFixed(1)
                                : '0.0'}
                              %
                            </p>
                          </div>
                          <div className="col-span-1">
                            <Tooltip content={t('asset-liability-weight-desc')}>
                              <p className="tooltip-underline text-xs text-th-fgd-3">
                                {t('asset-liability-weight')}
                              </p>
                            </Tooltip>
                            <div className="flex space-x-1.5 text-right font-mono">
                              <p className="text-th-fgd-1">
                                {bank.initAssetWeight.toFixed(2)}
                              </p>
                              <span className="text-th-fgd-4">|</span>
                              <p className="text-th-fgd-1">
                                {bank.initLiabWeight.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <div className="col-span-1">
                            <LinkButton
                              className="flex items-center"
                              onClick={() => goToTokenPage(bank)}
                            >
                              {t('token:token-details')}
                              <ChevronRightIcon className="ml-2 h-5 w-5" />
                            </LinkButton>
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
    </ContentBox>
  ) : null
}

export default TokenStats
