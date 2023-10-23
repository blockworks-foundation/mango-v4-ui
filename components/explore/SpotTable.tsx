import { useTranslation } from 'next-i18next'
import { useCallback } from 'react'
import useMangoGroup from 'hooks/useMangoGroup'
import {
  SortableColumnHeader,
  Table,
  Td,
  Th,
  TrBody,
  TrHead,
} from '@components/shared/TableElements'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import { numberCompacter } from 'utils/numbers'
import SimpleAreaChart from '@components/shared/SimpleAreaChart'
import { Disclosure, Transition } from '@headlessui/react'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import useThemeWrapper from 'hooks/useThemeWrapper'
import { useSortableData } from 'hooks/useSortableData'
import Change from '@components/shared/Change'
import { Bank } from '@blockworks-foundation/mango-v4'
import { useViewport } from 'hooks/useViewport'
import { breakpoints } from 'utils/theme'
import ContentBox from '@components/shared/ContentBox'
import { COLORS } from 'styles/colors'
import TokenLogo from '@components/shared/TokenLogo'
import { goToTokenPage } from '@components/stats/tokens/TokenOverviewTable'
import { useRouter } from 'next/router'
import Decimal from 'decimal.js'
import BankAmountWithValue from '@components/shared/BankAmountWithValue'
import { BankWithMarketData } from './Spot'
import { SerumMarketWithMarketData } from 'hooks/useListedMarketsWithMarketData'
import Tooltip from '@components/shared/Tooltip'
import dayjs from 'dayjs'
import TableTokenName from '@components/shared/TableTokenName'

type TableData = {
  assetWeight: string
  available: Decimal
  baseBank: Bank
  borrowRate: number
  change: number
  depositRate: number
  tokenName: string
  market: SerumMarketWithMarketData | undefined
  price: number
  priceHistory: {
    price: number
    time: string
  }[]
  volume: number
  isUp: boolean
}

const SpotTable = ({ tokens }: { tokens: BankWithMarketData[] }) => {
  const { t } = useTranslation('common')
  const { group } = useMangoGroup()
  const { theme } = useThemeWrapper()
  const { width } = useViewport()
  const router = useRouter()
  const showTableView = width ? width > breakpoints.md : false

  const formattedTableData = useCallback(
    (tokens: BankWithMarketData[]) => {
      const formatted = []
      for (const token of tokens) {
        const baseBank = token.bank
        const price = baseBank.uiPrice

        const pastPrice = token.market?.marketData?.price_24h

        const priceHistory =
          token.market?.marketData?.price_history
            .sort((a, b) => a.time.localeCompare(b.time))
            .concat([{ price: price, time: dayjs().toISOString() }]) || []

        const volume = token.market?.marketData?.quote_volume_24h || 0

        const change =
          volume > 0 && pastPrice ? ((price - pastPrice) / pastPrice) * 100 : 0

        const tokenName = baseBank.name

        let availableVaultBalance = 0
        let available = new Decimal(0)
        let depositRate = 0
        let borrowRate = 0
        let assetWeight = '0'

        if (baseBank) {
          availableVaultBalance = group
            ? group.getTokenVaultBalanceByMintUi(baseBank.mint) -
              baseBank.uiDeposits() * baseBank.minVaultToDepositsRatio
            : 0
          available = Decimal.max(
            0,
            availableVaultBalance.toFixed(baseBank.mintDecimals),
          )
          depositRate = baseBank.getDepositRateUi()
          borrowRate = baseBank.getBorrowRateUi()
          assetWeight = baseBank
            .scaledInitAssetWeight(baseBank.price)
            .toFixed(2)
        }

        const isUp =
          price && priceHistory.length ? price >= priceHistory[0].price : false

        const data = {
          available,
          assetWeight,
          borrowRate,
          baseBank,
          change,
          depositRate,
          market: token.market,
          price,
          priceHistory,
          tokenName,
          volume,
          isUp,
        }
        formatted.push(data)
      }
      return formatted
    },
    [group],
  )

  const {
    items: tableData,
    requestSort,
    sortConfig,
  } = useSortableData(formattedTableData(tokens))

  return (
    <ContentBox hideBorder hidePadding>
      {showTableView ? (
        <Table>
          <thead>
            <TrHead>
              <Th className="text-left">
                <SortableColumnHeader
                  sortKey="tokenName"
                  sort={() => requestSort('tokenName')}
                  sortConfig={sortConfig}
                  title={t('token')}
                />
              </Th>
              <Th>
                <div className="flex justify-end">
                  <SortableColumnHeader
                    sortKey="price"
                    sort={() => requestSort('price')}
                    sortConfig={sortConfig}
                    title={t('price')}
                  />
                </div>
              </Th>
              <Th>
                <div className="flex justify-end">
                  <SortableColumnHeader
                    sortKey="change"
                    sort={() => requestSort('change')}
                    sortConfig={sortConfig}
                    title={t('rolling-change')}
                  />
                </div>
              </Th>
              <Th className="hidden text-right md:block"></Th>
              <Th>
                <div className="flex justify-end">
                  <SortableColumnHeader
                    sortKey="volume"
                    sort={() => requestSort('volume')}
                    sortConfig={sortConfig}
                    title={t('trade:24h-volume')}
                  />
                </div>
              </Th>
              <Th>
                <div className="flex justify-end">
                  <Tooltip content={t('tooltip-available', { token: '' })}>
                    <SortableColumnHeader
                      sortKey="available"
                      sort={() => requestSort('available')}
                      sortConfig={sortConfig}
                      title={t('available')}
                      titleClass="tooltip-underline"
                    />
                  </Tooltip>
                </div>
              </Th>
              <Th>
                <div className="flex justify-end">
                  <Tooltip
                    content={t('tooltip-collateral-weight', { token: '' })}
                  >
                    <SortableColumnHeader
                      sortKey="assetWeight"
                      sort={() => requestSort('assetWeight')}
                      sortConfig={sortConfig}
                      title={t('explore:collateral-weight')}
                      titleClass="tooltip-underline"
                    />
                  </Tooltip>
                </div>
              </Th>
              <Th>
                <div className="flex justify-end">
                  <Tooltip content={t('tooltip-interest-rates')}>
                    <SortableColumnHeader
                      sortKey="depositRate"
                      sort={() => requestSort('depositRate')}
                      sortConfig={sortConfig}
                      title={t('rates')}
                      titleClass="tooltip-underline"
                    />
                  </Tooltip>
                </div>
              </Th>
              <Th />
            </TrHead>
          </thead>
          <tbody>
            {tableData.map((data) => {
              const {
                available,
                assetWeight,
                baseBank,
                borrowRate,
                change,
                depositRate,
                market,
                price,
                priceHistory,
                tokenName,
                volume,
                isUp,
              } = data

              if (!baseBank) return null

              return (
                <TrBody
                  className="default-transition md:hover:cursor-pointer md:hover:bg-th-bkg-2"
                  key={tokenName}
                  onClick={() => goToTokenPage(tokenName.split(' ')[0], router)}
                >
                  <Td>
                    <TableTokenName bank={baseBank} symbol={tokenName} />
                  </Td>
                  <Td>
                    <div className="flex flex-col text-right">
                      <p>
                        {price ? (
                          <>
                            <FormatNumericValue value={price} isUsd />
                          </>
                        ) : (
                          '–'
                        )}
                      </p>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex flex-col items-end">
                      {market ? (
                        <Change change={change} suffix="%" />
                      ) : (
                        <span>–</span>
                      )}
                    </div>
                  </Td>
                  <Td>
                    {priceHistory.length ? (
                      <div className="h-10 w-24">
                        <SimpleAreaChart
                          color={isUp ? COLORS.UP[theme] : COLORS.DOWN[theme]}
                          data={priceHistory}
                          name={tokenName}
                          xKey="time"
                          yKey="price"
                        />
                      </div>
                    ) : !market ? null : (
                      <p className="mb-0 text-th-fgd-4">{t('unavailable')}</p>
                    )}
                  </Td>
                  <Td>
                    <div className="flex flex-col text-right">
                      <p>
                        {!market ? (
                          '–'
                        ) : volume ? (
                          <span>
                            {numberCompacter.format(volume)}{' '}
                            <span className="font-body text-th-fgd-4">
                              USDC
                            </span>
                          </span>
                        ) : (
                          <span>
                            0{' '}
                            <span className="font-body text-th-fgd-4">
                              USDC
                            </span>
                          </span>
                        )}
                      </p>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex flex-col text-right">
                      <BankAmountWithValue
                        amount={available}
                        bank={baseBank}
                        fixDecimals={false}
                        stacked
                      />
                    </div>
                  </Td>
                  <Td className="text-right font-mono">{assetWeight}x</Td>
                  <Td>
                    <div className="flex justify-end space-x-1.5">
                      <p className="text-th-up">
                        <FormatNumericValue value={depositRate} decimals={2} />%
                      </p>
                      <span className="text-th-fgd-4">|</span>
                      <p className="text-th-down">
                        <FormatNumericValue value={borrowRate} decimals={2} />%
                      </p>
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
      ) : (
        <div className="border-b border-th-bkg-3">
          {tableData.map((data) => {
            return <MobileSpotItem key={data.tokenName} data={data} />
          })}
        </div>
      )}
    </ContentBox>
  )
}

export default SpotTable

const MobileSpotItem = ({ data }: { data: TableData }) => {
  const { t } = useTranslation('common')
  const { theme } = useThemeWrapper()

  const {
    available,
    assetWeight,
    baseBank,
    borrowRate,
    change,
    depositRate,
    market,
    price,
    priceHistory,
    tokenName,
    volume,
    isUp,
  } = data

  return (
    <Disclosure>
      {({ open }) => (
        <>
          <Disclosure.Button
            className={`w-full border-t border-th-bkg-3 p-4 text-left first:border-t-0 focus:outline-none`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex flex-shrink-0 items-center">
                  <TokenLogo bank={baseBank} />
                </div>
                <p className="ml-3 leading-none text-th-fgd-1">{tokenName}</p>
              </div>
              <div className="flex items-center space-x-3">
                {priceHistory.length ? (
                  <div className="h-10 w-20">
                    <SimpleAreaChart
                      color={isUp ? COLORS.UP[theme] : COLORS.DOWN[theme]}
                      data={priceHistory}
                      name={tokenName}
                      xKey="time"
                      yKey="price"
                    />
                  </div>
                ) : !market ? null : (
                  <p className="mb-0 text-th-fgd-4">{t('unavailable')}</p>
                )}
                {market ? <Change change={change} suffix="%" /> : null}
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
              <div className="mx-4 grid grid-cols-2 gap-4 border-t border-th-bkg-3 pb-4 pt-4">
                <div className="col-span-1">
                  <p className="text-xs text-th-fgd-3">{t('price')}</p>
                  <p className="font-mono text-th-fgd-2">
                    {price ? <FormatNumericValue value={price} isUsd /> : '-'}
                  </p>
                </div>
                <div className="col-span-1">
                  <p className="text-xs text-th-fgd-3">
                    {t('trade:24h-volume')}
                  </p>
                  <p className="font-mono text-th-fgd-2">
                    {!market ? (
                      '–'
                    ) : volume ? (
                      <span>
                        {numberCompacter.format(volume)}{' '}
                        <span className="font-body text-th-fgd-4">USDC</span>
                      </span>
                    ) : (
                      <span>
                        0 <span className="font-body text-th-fgd-4">USDC</span>
                      </span>
                    )}
                  </p>
                </div>
                <div className="col-span-1">
                  <p className="text-xs text-th-fgd-3">{t('available')}</p>
                  <BankAmountWithValue
                    amount={available}
                    bank={baseBank}
                    fixDecimals={false}
                  />
                </div>
                <div className="col-span-1">
                  <p className="text-xs text-th-fgd-3">
                    {t('explore:collateral-weight')}
                  </p>
                  <p className="font-mono text-th-fgd-2">{assetWeight}x</p>
                </div>
                <div className="col-span-1">
                  <p className="text-xs text-th-fgd-3">{t('rates')}</p>
                  <div className="flex space-x-1.5">
                    <p className="text-th-up">
                      <FormatNumericValue value={depositRate} decimals={2} />%
                    </p>
                    <span className="text-th-fgd-4">|</span>
                    <p className="text-th-down">
                      <FormatNumericValue value={borrowRate} decimals={2} />%
                    </p>
                  </div>
                </div>
              </div>
            </Disclosure.Panel>
          </Transition>
        </>
      )}
    </Disclosure>
  )
}
