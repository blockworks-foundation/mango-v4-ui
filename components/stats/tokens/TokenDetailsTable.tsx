import { Disclosure, Transition } from '@headlessui/react'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import { useTranslation } from 'next-i18next'
import { useViewport } from '../../../hooks/useViewport'
import { breakpoints } from '../../../utils/theme'
import ContentBox from '../../shared/ContentBox'
import Tooltip from '@components/shared/Tooltip'
import { Bank } from '@blockworks-foundation/mango-v4'
import {
  SortableColumnHeader,
  Table,
  Td,
  Th,
  TrBody,
  TrHead,
} from '@components/shared/TableElements'
import useMangoGroup from 'hooks/useMangoGroup'
import useBanksWithBalances from 'hooks/useBanksWithBalances'
import { getOracleProvider } from 'hooks/useOracleProvider'
import { useRouter } from 'next/router'
import { goToTokenPage } from './TokenOverviewTable'
import { LinkButton } from '@components/shared/Button'
import { useCallback } from 'react'
import { useSortableData } from 'hooks/useSortableData'
import TableTokenName from '@components/shared/TableTokenName'
import CollateralWeightDisplay from '@components/shared/CollateralWeightDisplay'
import OracleProvider from '@components/shared/OracleProvider'

const TokenDetailsTable = () => {
  const { t } = useTranslation(['common', 'activity', 'token', 'trade'])
  const { group } = useMangoGroup()
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false
  const banks = useBanksWithBalances()
  const router = useRouter()

  const formattedTableData = useCallback(() => {
    const formatted = []
    for (const b of banks) {
      const bank: Bank = b.bank
      const mintInfo = group?.mintInfosMapByMint.get(bank.mint.toString())
      const deposits = bank.uiDeposits()
      const initAssetWeight = bank.scaledInitAssetWeight(bank.price)
      const initLiabWeight = bank.scaledInitLiabWeight(bank.price)
      const isInsured = mintInfo?.groupInsuranceFund ? t('yes') : t('no')
      const liquidationFee = bank.liquidationFee.toNumber() * 100
      const loanOriginationFee = 100 * bank.loanOriginationFeeRate.toNumber()
      const [oracleProvider, oracleLinkPath] = getOracleProvider(bank)
      const symbol = bank.name

      const data = {
        bank,
        deposits,
        initAssetWeight,
        initLiabWeight,
        isInsured,
        liquidationFee,
        loanOriginationFee,
        oracleLinkPath,
        oracleProvider,
        symbol,
      }
      formatted.push(data)
    }
    return formatted.sort(
      (a, b) => b.deposits * b.bank.uiPrice - a.deposits * a.bank.uiPrice,
    )
  }, [banks, group])

  const {
    items: tableData,
    requestSort,
    sortConfig,
  } = useSortableData(formattedTableData())

  return group ? (
    <ContentBox hideBorder hidePadding>
      {showTableView ? (
        <div className="thin-scroll overflow-x-auto">
          <Table>
            <thead>
              <TrHead>
                <Th className="text-left">
                  <SortableColumnHeader
                    sortKey="symbol"
                    sort={() => requestSort('symbol')}
                    sortConfig={sortConfig}
                    title={t('token')}
                  />
                </Th>
                <Th>
                  <div className="flex justify-end">
                    <Tooltip content={t('asset-liability-weight-desc')}>
                      <SortableColumnHeader
                        sortKey="initAssetWeight"
                        sort={() => requestSort('initAssetWeight')}
                        sortConfig={sortConfig}
                        title={t('asset-liability-weight')}
                      />
                    </Tooltip>
                  </div>
                </Th>
                <Th>
                  <div className="flex justify-end">
                    <Tooltip content={t('tooltip-borrow-fee')}>
                      <SortableColumnHeader
                        sortKey="loanOriginationFee"
                        sort={() => requestSort('loanOriginationFee')}
                        sortConfig={sortConfig}
                        title={t('borrow-fee')}
                      />
                    </Tooltip>
                  </div>
                </Th>
                <Th>
                  <div className="flex justify-end">
                    <Tooltip
                      content={t('token:tooltip-liquidation-fee', {
                        symbol: t('tokens').toLowerCase(),
                      })}
                    >
                      <SortableColumnHeader
                        sortKey="liquidationFee"
                        sort={() => requestSort('liquidationFee')}
                        sortConfig={sortConfig}
                        title={t('activity:liquidation-fee')}
                      />
                    </Tooltip>
                  </div>
                </Th>
                <Th>
                  <div className="flex justify-end">
                    <Tooltip
                      content={
                        <div>
                          {t('trade:tooltip-insured', { tokenOrMarket: '' })}
                          <a
                            className="mt-2 flex items-center"
                            href="https://docs.mango.markets/mango-markets/insurance-fund"
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            Learn more
                          </a>
                        </div>
                      }
                    >
                      <SortableColumnHeader
                        sortKey="isInsured"
                        sort={() => requestSort('isInsured')}
                        sortConfig={sortConfig}
                        title={t('trade:insured', { token: '' })}
                      />
                    </Tooltip>
                  </div>
                </Th>
                <Th>
                  <div className="flex justify-end">
                    <SortableColumnHeader
                      sortKey="oracleProvider"
                      sort={() => requestSort('oracleProvider')}
                      sortConfig={sortConfig}
                      title={t('trade:oracle')}
                    />
                  </div>
                </Th>
                <Th />
              </TrHead>
            </thead>
            <tbody>
              {tableData.map((data) => {
                const {
                  bank,
                  initLiabWeight,
                  isInsured,
                  liquidationFee,
                  loanOriginationFee,
                  symbol,
                } = data

                return (
                  <TrBody
                    className="default-transition md:hover:cursor-pointer md:hover:bg-th-bkg-2"
                    key={symbol}
                    onClick={() => goToTokenPage(symbol.split(' ')[0], router)}
                  >
                    <Td>
                      <TableTokenName bank={bank} symbol={symbol} />
                    </Td>
                    <Td>
                      <div className="flex justify-end space-x-1.5 text-right font-mono">
                        <CollateralWeightDisplay bank={bank} />
                        <span className="text-th-fgd-4">|</span>
                        <p>{initLiabWeight.toFixed(2)}x</p>
                      </div>
                    </Td>
                    <Td>
                      <p className="text-right">
                        {loanOriginationFee.toFixed(2)}%
                      </p>
                    </Td>
                    <Td>
                      <p className="text-right">{liquidationFee.toFixed(2)}%</p>
                    </Td>
                    <Td>
                      <p className="text-right">{isInsured}</p>
                    </Td>
                    <Td>
                      <div className="flex justify-end">
                        <OracleProvider bank={bank} />
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
            const mintInfo = group.mintInfosMapByMint.get(bank.mint.toString())
            return (
              <Disclosure key={bank.name}>
                {({ open }) => (
                  <>
                    <Disclosure.Button
                      className={`w-full border-t border-th-bkg-3 p-4 text-left focus:outline-none ${
                        i === 0 ? 'border-t-0' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <TableTokenName bank={bank} symbol={bank.name} />
                        <ChevronDownIcon
                          className={`${
                            open ? 'rotate-180' : 'rotate-0'
                          } h-6 w-6 shrink-0 text-th-fgd-3`}
                        />
                      </div>
                    </Disclosure.Button>
                    <Transition
                      enter="transition ease-in duration-200"
                      enterFrom="opacity-0"
                      enterTo="opacity-100"
                    >
                      <Disclosure.Panel>
                        <div className="mx-4 grid grid-cols-2 gap-4 border-t border-th-bkg-3 py-4">
                          <div className="col-span-1">
                            <Tooltip
                              content={t('asset-liability-weight-desc')}
                              placement="top-start"
                            >
                              <p className="tooltip-underline text-xs text-th-fgd-3">
                                {t('asset-liability-weight')}
                              </p>
                            </Tooltip>
                            <div className="flex space-x-1.5 text-right font-mono text-th-fgd-1">
                              <CollateralWeightDisplay bank={bank} />
                              <span className="text-th-fgd-4">|</span>
                              <span>
                                {bank
                                  .scaledInitLiabWeight(bank.price)
                                  .toFixed(2)}
                                x
                              </span>
                            </div>
                          </div>
                          <div className="col-span-1">
                            <Tooltip
                              content={t('tooltip-borrow-fee')}
                              placement="top-start"
                            >
                              <p className="tooltip-underline text-xs">
                                {t('borrow-fee')}
                              </p>
                            </Tooltip>
                            <p className="font-mono text-th-fgd-1">
                              {(
                                100 * bank.loanOriginationFeeRate.toNumber()
                              ).toFixed(2)}
                              %
                            </p>
                          </div>
                          <div className="col-span-1">
                            <Tooltip
                              content={t('token:tooltip-liquidation-fee', {
                                symbol: bank.name,
                              })}
                              placement="top-start"
                            >
                              <p className="tooltip-underline text-xs">
                                {t('activity:liquidation-fee')}
                              </p>
                            </Tooltip>
                            <p className="font-mono text-th-fgd-1">
                              {(bank.liquidationFee.toNumber() * 100).toFixed(
                                2,
                              )}
                              %
                            </p>
                          </div>
                          <div className="col-span-1">
                            <p className="text-xs">{t('trade:oracle')}</p>
                            <OracleProvider bank={bank} />
                          </div>
                          <div className="col-span-1">
                            <Tooltip
                              content={
                                <div>
                                  {t('trade:tooltip-insured', {
                                    tokenOrMarket: '',
                                  })}
                                  <a
                                    className="mt-2 flex items-center"
                                    href="https://docs.mango.markets/mango-markets/insurance-fund"
                                    rel="noopener noreferrer"
                                    target="_blank"
                                  >
                                    Learn more
                                  </a>
                                </div>
                              }
                              placement="top-start"
                            >
                              <span className="tooltip-underline text-xs">
                                {t('trade:insured', { token: '' })}
                              </span>
                            </Tooltip>
                            <p className="font-mono text-th-fgd-1">
                              {mintInfo?.groupInsuranceFund
                                ? t('yes')
                                : t('no')}
                            </p>
                          </div>
                          <div className="col-span-1">
                            <LinkButton
                              className="flex items-center"
                              onClick={() =>
                                goToTokenPage(bank.name.split(' ')[0], router)
                              }
                            >
                              {t('token:token-stats', { token: bank.name })}
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

export default TokenDetailsTable
