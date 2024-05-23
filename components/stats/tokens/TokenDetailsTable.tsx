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
import { floorToDecimal } from 'utils/numbers'
import { LeverageMaxDisplay } from '@components/explore/SpotTable'

const TokenDetailsTable = () => {
  const { t } = useTranslation([
    'common',
    'activity',
    'stats',
    'token',
    'trade',
  ])
  const { group } = useMangoGroup()
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false
  const banks = useBanksWithBalances(undefined, true)
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
      const liquidationFee =
        bank.liquidationFee.toNumber() * 100 +
        bank.platformLiquidationFee.toNumber() * 100
      const loanOriginationFee = 100 * bank.loanOriginationFeeRate.toNumber()
      const [oracleProvider, oracleLinkPath] = getOracleProvider(bank)
      const symbol = bank.name
      const collateralFeeRate = bank.collateralFeePerDay * 100
      const weight = bank.scaledInitAssetWeight(bank.price)
      const leverageFactor = 1 / (1 - weight.toNumber())
      const leverageMax = floorToDecimal(leverageFactor, 1).toNumber()

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
        collateralFeeRate,
        leverageMax,
      }
      formatted.push(data)
    }
    return formatted.sort(
      (a, b) => b.deposits * b.bank.uiPrice - a.deposits * a.bank.uiPrice,
    )
  }, [banks, group, t])

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
                        titleClass="tooltip-underline"
                      />
                    </Tooltip>
                  </div>
                </Th>
                <Th>
                  <div className="flex justify-end">
                    <SortableColumnHeader
                      sortKey="leverageMax"
                      sort={() => requestSort('leverageMax')}
                      sortConfig={sortConfig}
                      title={t('trade:max-leverage')}
                    />
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
                        titleClass="tooltip-underline"
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
                        titleClass="tooltip-underline"
                      />
                    </Tooltip>
                  </div>
                </Th>
                <Th>
                  <div className="flex justify-end">
                    <Tooltip content={<CollateralFundingFeeTooltip />}>
                      <SortableColumnHeader
                        sortKey="collateralFeeRate"
                        sort={() => requestSort('collateralFeeRate')}
                        sortConfig={sortConfig}
                        title={t('stats:collateral-funding-fee')}
                        titleClass="tooltip-underline"
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
                        titleClass="tooltip-underline"
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
                  collateralFeeRate,
                  leverageMax,
                } = data

                return (
                  <TrBody
                    className="default-transition md:hover:cursor-pointer md:hover:bg-th-bkg-2"
                    key={symbol}
                    onClick={() => goToTokenPage(symbol.split(' ')[0], router)}
                  >
                    <Td>
                      <TableTokenName
                        bank={bank}
                        symbol={symbol}
                        showLeverage
                      />
                    </Td>
                    <Td>
                      <div className="flex justify-end space-x-1.5 text-right font-mono">
                        <CollateralWeightDisplay bank={bank} />
                        <span className="text-th-fgd-4">|</span>
                        <p>{initLiabWeight.toFixed(2)}x</p>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex flex-col text-right">
                        <LeverageMaxDisplay leverageMax={leverageMax} />
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
                      <p className="text-right">
                        {collateralFeeRate.toFixed(2)}%
                      </p>
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
          {tableData.map((data, i) => {
            const {
              bank,
              initLiabWeight,
              isInsured,
              liquidationFee,
              loanOriginationFee,
              collateralFeeRate,
              leverageMax,
            } = data
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
                        <TableTokenName
                          bank={bank}
                          symbol={bank.name}
                          showLeverage
                        />
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
                              <span>{initLiabWeight.toFixed(2)}x</span>
                            </div>
                          </div>
                          <div className="col-span-1">
                            <p className="text-xs text-th-fgd-3">
                              {t('trade:max-leverage')}
                            </p>
                            <LeverageMaxDisplay leverageMax={leverageMax} />
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
                              {loanOriginationFee.toFixed(2)}%
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
                              {liquidationFee.toFixed(2)}%
                            </p>
                          </div>
                          <div className="col-span-1">
                            <Tooltip
                              content={<CollateralFundingFeeTooltip />}
                              placement="top-start"
                            >
                              <p className="tooltip-underline text-xs">
                                {t('stats:collateral-funding-fee')}
                              </p>
                            </Tooltip>
                            <p className="font-mono text-th-fgd-1">
                              {collateralFeeRate.toFixed(2)}%
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
                            <p className="text-th-fgd-1">{isInsured}</p>
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

export const CollateralFundingFeeTooltip = () => {
  return (
    <>
      <p className="mb-2">
        This is charged on some assets once every 24h as insurance for taking on
        margin against riskier collateral.
      </p>
      <p className="mb-2">
        The collateral funding fee is a dynamic formula that uses a fixed rate.
        This rate is then multiplied by the ratio of your USDC liabilities (the
        amount you&apos;ve borrowed) against your weighted deposits (the value
        of your position adjusted by a factor between 0 and 1).
      </p>
      <p className="mb-2">
        A key aspect of this fee is its dynamism; it scales with your
        position&apos;s proximity to liquidation. Positions closer to
        liquidation are subjected to a higher fee, reflecting increased risk,
        while positions further from liquidation incur a lower fee.
        Consequently, the more leverage you take on the more collateral fees
        you&apos;ll pay.
      </p>
      <a
        href="https://docs.mango.markets/mango-markets/fees"
        target="_blank"
        rel="noopener noreferrer"
      >
        More Info
      </a>
    </>
  )
}
