import { Transition } from '@headlessui/react'
import {
  ChevronDownIcon,
  ChevronRightIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/20/solid'
import { useTranslation } from 'next-i18next'
import Image from 'next/legacy/image'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { useViewport } from '../../hooks/useViewport'
import { formatDecimal, formatFixedDecimals } from '../../utils/numbers'
import { breakpoints } from '../../utils/theme'
import { IconButton, LinkButton } from '../shared/Button'
import ContentBox from '../shared/ContentBox'
import Tooltip from '@components/shared/Tooltip'
import { Bank } from '@blockworks-foundation/mango-v4'
import { useRouter } from 'next/router'
import useJupiterMints from 'hooks/useJupiterMints'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import useMangoGroup from 'hooks/useMangoGroup'
import mangoStore from '@store/mangoStore'

const TokenStats = () => {
  const { t } = useTranslation(['common', 'token'])
  const actions = mangoStore.getState().actions
  const initialStatsLoad = mangoStore((s) => s.tokenStats.initialLoad)
  const [showTokenDetails, setShowTokenDetails] = useState('')
  const { group } = useMangoGroup()
  const { mangoTokens } = useJupiterMints()
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false
  const router = useRouter()

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

  const goToTokenPage = (bank: Bank) => {
    router.push(`/token/${bank.name}`, undefined, { shallow: true })
  }

  return (
    <ContentBox hideBorder hidePadding>
      {showTableView ? (
        <Table>
          <thead>
            <TrHead>
              <Th className="text-left">{t('token')}</Th>
              <Th className="text-right">{t('total-deposits')}</Th>
              <Th className="text-right">{t('total-borrows')}</Th>
              <Th>
                <div className="flex justify-end">
                  <Tooltip content="The deposit rate (green) will automatically be paid on positive balances and the borrow rate (red) will automatically be charged on negative balances.">
                    <span className="tooltip-underline">{t('rates')}</span>
                  </Tooltip>
                </div>
              </Th>
              <Th>
                <div className="flex justify-end">
                  <Tooltip content="The percentage of deposits that have been lent out.">
                    <span className="tooltip-underline">
                      {t('utilization')}
                    </span>
                  </Tooltip>
                </div>
              </Th>
              <Th>
                <div className="flex justify-end text-right">
                  <Tooltip content={t('asset-weight-desc')}>
                    <span className="tooltip-underline">
                      {t('asset-weight')}
                    </span>
                  </Tooltip>
                </div>
              </Th>
              <Th>
                <div className="flex items-center justify-end">
                  <span className="text-right">{t('liability-weight')}</span>
                </div>
              </Th>
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
              const deposits = bank.uiDeposits()
              const borrows = bank.uiBorrows()
              const price = bank.uiPrice

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
                      <p className="font-body tracking-wider">{bank.name}</p>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex flex-col text-right">
                      <p>{formatFixedDecimals(deposits)}</p>
                      <p className="text-th-fgd-4">
                        {formatFixedDecimals(deposits * price, false, true)}
                      </p>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex flex-col text-right">
                      <p>{formatFixedDecimals(borrows)}</p>
                      <p className="text-th-fgd-4">
                        {formatFixedDecimals(borrows * price, false, true)}
                      </p>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex justify-end space-x-2">
                      <p className="text-th-up">
                        {formatDecimal(bank.getDepositRateUi(), 2, {
                          fixed: true,
                        })}
                        %
                      </p>
                      <span className="text-th-fgd-4">|</span>
                      <p className="text-th-down">
                        {formatDecimal(bank.getBorrowRateUi(), 2, {
                          fixed: true,
                        })}
                        %
                      </p>
                    </div>
                  </Td>
                  <Td>
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
                  </Td>
                  <Td>
                    <div className="text-right">
                      <p>{bank.initAssetWeight.toFixed(2)}</p>
                    </div>
                  </Td>
                  <Td>
                    <div className="text-right">
                      <p>{bank.initLiabWeight.toFixed(2)}</p>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex justify-end">
                      <IconButton
                        onClick={() => goToTokenPage(bank)}
                        size="small"
                      >
                        <ChevronRightIcon className="h-5 w-5" />
                      </IconButton>
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
            const deposits = bank.uiDeposits()
            const borrows = bank.uiBorrows()
            const price = bank.uiPrice
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
                        {t('total-deposits')}
                      </p>
                      <p className="text-right font-mono text-th-fgd-1">
                        {formatFixedDecimals(deposits)}
                      </p>
                      <p className="text-right text-th-fgd-4">
                        {formatFixedDecimals(deposits * price, false, true)}
                      </p>
                    </div>
                    <div>
                      <p className="mb-0.5 text-right text-xs">
                        {t('total-borrows')}
                      </p>
                      <p className="text-right font-mono text-th-fgd-1">
                        {formatFixedDecimals(borrows)}
                      </p>
                      <p className="text-right text-th-fgd-4">
                        {formatFixedDecimals(borrows * price, false, true)}
                      </p>
                    </div>
                    <IconButton
                      onClick={() => handleShowTokenDetails(bank.name)}
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
                      <p className="text-xs text-th-fgd-3">{t('rates')}</p>
                      <p className="space-x-2">
                        <span className="font-mono text-th-up">
                          {formatDecimal(bank.getDepositRate().toNumber(), 2)}%
                        </span>
                        <span className="font-normal text-th-fgd-4">|</span>
                        <span className="font-mono text-th-down">
                          {formatDecimal(bank.getBorrowRate().toNumber(), 2)}%
                        </span>
                      </p>
                    </div>
                    <div className="col-span-1">
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
                    </div>
                    <div className="col-span-1">
                      <p className="text-xs text-th-fgd-3">
                        {t('asset-weight')}
                      </p>
                      <p className="font-mono text-th-fgd-1">
                        {bank.initAssetWeight.toFixed(2)}
                      </p>
                    </div>
                    <div className="col-span-1">
                      <p className="text-xs text-th-fgd-3">
                        {t('liability-weight')}
                      </p>
                      <p className="font-mono text-th-fgd-1">
                        {bank.initLiabWeight.toFixed(2)}
                      </p>
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
                </Transition>
              </div>
            )
          })}
        </div>
      )}
    </ContentBox>
  )
}

export default TokenStats
