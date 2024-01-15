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
import TableTokenName from '@components/shared/TableTokenName'
import { LinkButton } from '@components/shared/Button'
import { formatTokenSymbol } from 'utils/tokens'
import CollateralWeightDisplay from '@components/shared/CollateralWeightDisplay'

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
    time: number
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

        const priceHistory = token?.market?.priceHistory?.length
          ? token.market.priceHistory
              ?.sort((a, b) => a.time - b.time)
              .concat([{ price: price, time: Date.now() }])
          : []

        const volume = token.market?.marketData?.quote_volume_24h || 0

        const change = token.market?.rollingChange || 0

        const tokenName = baseBank.name

        let availableVaultBalance = 0
        let available = new Decimal(0)
        let availableValue = 0
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
          availableValue = available.mul(price).toNumber()
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
          availableValue,
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
        <div className="thin-scroll overflow-x-auto">
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
                        sortKey="availableValue"
                        sort={() => requestSort('availableValue')}
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
                    onClick={() =>
                      goToTokenPage(tokenName.split(' ')[0], router)
                    }
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
                        {market && price ? (
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
                      ) : (
                        <p className="mb-0 font-body text-th-fgd-4">
                          {t('unavailable')}
                        </p>
                      )}
                    </Td>
                    <Td>
                      <div className="flex flex-col text-right">
                        <p>
                          {!market || !market?.marketData ? (
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
                    <Td className="font-mono">
                      <div className="flex justify-end">
                        <CollateralWeightDisplay bank={baseBank} />
                      </div>
                    </Td>
                    <Td>
                      <div className="flex justify-end space-x-1.5">
                        <p className="text-th-up">
                          <FormatNumericValue
                            value={depositRate}
                            decimals={2}
                          />
                          %
                        </p>
                        <span className="text-th-fgd-4">|</span>
                        <p className="text-th-down">
                          <FormatNumericValue value={borrowRate} decimals={2} />
                          %
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
        </div>
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
  const router = useRouter()

  const {
    available,
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
              <div className="flex flex-1 items-center">
                <div className="flex shrink-0 items-center">
                  <TokenLogo bank={baseBank} />
                </div>
                <p className="ml-3 leading-tight text-th-fgd-1">{tokenName}</p>
              </div>
              <div className="flex items-center space-x-3 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-x-0">
                {priceHistory.length ? (
                  <div className="flex justify-end sm:min-w-[80px] sm:grid-cols-1">
                    <div className="h-10 w-20">
                      <SimpleAreaChart
                        color={isUp ? COLORS.UP[theme] : COLORS.DOWN[theme]}
                        data={priceHistory}
                        name={tokenName}
                        xKey="time"
                        yKey="price"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="mb-0 flex justify-end text-th-fgd-4">
                    {t('unavailable')}
                  </p>
                )}
                <div className="flex min-w-[140px] justify-end sm:grid-cols-1">
                  <div className="flex items-center space-x-3">
                    <div className="flex flex-col items-end">
                      <p className="font-mono text-th-fgd-2">
                        {price ? (
                          <FormatNumericValue value={price} isUsd />
                        ) : (
                          '-'
                        )}
                      </p>
                      {market ? <Change change={change} suffix="%" /> : null}
                    </div>
                    <ChevronDownIcon
                      className={`${
                        open ? 'rotate-180' : 'rotate-0'
                      } h-6 w-6 shrink-0 text-th-fgd-3`}
                    />
                  </div>
                </div>
              </div>
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
                  <div className="font-mono text-th-fgd-2">
                    <CollateralWeightDisplay bank={baseBank} />
                  </div>
                </div>
                <div className="col-span-1">
                  <p className="text-xs text-th-fgd-3">{t('rates')}</p>
                  <div className="flex space-x-1.5">
                    <p className="font-mono text-th-up">
                      <FormatNumericValue value={depositRate} decimals={2} />%
                    </p>
                    <span className="text-th-fgd-4">|</span>
                    <p className="font-mono text-th-down">
                      <FormatNumericValue value={borrowRate} decimals={2} />%
                    </p>
                  </div>
                </div>
                <div className="col-span-1">
                  <LinkButton
                    className="flex items-center"
                    onClick={() =>
                      goToTokenPage(baseBank.name.split(' ')[0], router)
                    }
                  >
                    {t('token:token-stats', {
                      token: formatTokenSymbol(baseBank.name),
                    })}
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
}
