import { useTranslation } from 'next-i18next'
import { useCallback } from 'react'
import MarketLogos from '@components/trade/MarketLogos'
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
import { floorToDecimal, getDecimalCount, numberCompacter } from 'utils/numbers'
import SimpleAreaChart from '@components/shared/SimpleAreaChart'
import { Disclosure, Transition } from '@headlessui/react'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import useThemeWrapper from 'hooks/useThemeWrapper'
import { SerumMarketWithMarketData } from 'hooks/useListedMarketsWithMarketData'
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

type TableData = {
  baseBank: Bank | undefined
  change: number
  market: SerumMarketWithMarketData
  tokenName: string | undefined
  price: number
  priceHistory:
    | {
        price: number
        time: string
      }[]
    | undefined
  quoteBank: Bank | undefined
  volume: number
  isUp: boolean
}

const SpotMarketsTable = ({
  markets,
}: {
  markets: SerumMarketWithMarketData[]
}) => {
  const { t } = useTranslation('common')
  const { group } = useMangoGroup()
  const { theme } = useThemeWrapper()
  const { width } = useViewport()
  const router = useRouter()
  const showTableView = width ? width > breakpoints.md : false

  const formattedTableData = useCallback(
    (markets: SerumMarketWithMarketData[]) => {
      const formatted = []
      for (const m of markets) {
        const baseBank = group?.getFirstBankByTokenIndex(m.baseTokenIndex)
        const quoteBank = group?.getFirstBankByTokenIndex(m.quoteTokenIndex)
        const market = group?.getSerum3ExternalMarket(m.serumMarketExternal)
        let price = 0
        if (baseBank && market && quoteBank) {
          price = floorToDecimal(
            baseBank.uiPrice / quoteBank.uiPrice,
            getDecimalCount(market.tickSize),
          ).toNumber()
        }

        const pastPrice = m?.marketData?.price_24h || 0

        const priceHistory = m?.marketData?.price_history

        const volume = m?.marketData?.quote_volume_24h || 0

        const change = volume > 0 ? ((price - pastPrice) / pastPrice) * 100 : 0

        const tokenName = baseBank?.name

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
          price && priceHistory && priceHistory.length
            ? price >= priceHistory[0].price
            : false

        const data = {
          available,
          assetWeight,
          borrowRate,
          baseBank,
          change,
          depositRate,
          market: m,
          tokenName,
          price,
          priceHistory,
          quoteBank,
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
  } = useSortableData(formattedTableData(markets))

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
                  <SortableColumnHeader
                    sortKey="available"
                    sort={() => requestSort('available')}
                    sortConfig={sortConfig}
                    title={t('available')}
                  />
                </div>
              </Th>
              <Th>
                <div className="flex justify-end">
                  <SortableColumnHeader
                    sortKey="assetWeight"
                    sort={() => requestSort('assetWeight')}
                    sortConfig={sortConfig}
                    title={t('collateral-weight')}
                  />
                </div>
              </Th>
              <Th>
                <div className="flex justify-end">
                  <SortableColumnHeader
                    sortKey="depositRate"
                    sort={() => requestSort('depositRate')}
                    sortConfig={sortConfig}
                    title={t('rates')}
                  />
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
                tokenName,
                price,
                priceHistory,
                quoteBank,
                volume,
                isUp,
              } = data

              if (!baseBank) return null

              return (
                <TrBody
                  className="default-transition md:hover:cursor-pointer md:hover:bg-th-bkg-2"
                  key={market.publicKey.toString()}
                  onClick={() =>
                    goToTokenPage(baseBank.name.split(' ')[0], router)
                  }
                >
                  <Td>
                    <div className="flex items-center">
                      <TokenLogo bank={baseBank} />
                      <p className="ml-3 font-body">{tokenName}</p>
                    </div>
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
                      <Change change={change} suffix="%" />
                    </div>
                  </Td>
                  <Td>
                    {priceHistory && priceHistory.length ? (
                      <div className="h-10 w-24">
                        <SimpleAreaChart
                          color={isUp ? COLORS.UP[theme] : COLORS.DOWN[theme]}
                          data={priceHistory}
                          name={baseBank!.name + quoteBank!.name}
                          xKey="time"
                          yKey="price"
                        />
                      </div>
                    ) : baseBank?.name === 'USDC' ||
                      baseBank?.name === 'USDT' ? null : (
                      <p className="mb-0 text-th-fgd-4">{t('unavailable')}</p>
                    )}
                  </Td>
                  <Td>
                    <div className="flex flex-col text-right">
                      <p>
                        {volume ? (
                          <span>
                            {numberCompacter.format(volume)}{' '}
                            <span className="font-body text-th-fgd-4">
                              {quoteBank?.name}
                            </span>
                          </span>
                        ) : (
                          <span>
                            0{' '}
                            <span className="font-body text-th-fgd-4">
                              {quoteBank?.name}
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
            return (
              <MobileSpotMarketItem
                key={data.market.publicKey.toString()}
                data={data}
              />
            )
          })}
        </div>
      )}
    </ContentBox>
  )
}

export default SpotMarketsTable

const MobileSpotMarketItem = ({ data }: { data: TableData }) => {
  const { t } = useTranslation('common')
  const { theme } = useThemeWrapper()

  const {
    baseBank,
    change,
    market,
    tokenName,
    price,
    priceHistory,
    quoteBank,
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
                  <MarketLogos market={market} />
                </div>
                <p className="leading-none text-th-fgd-1">{tokenName}</p>
              </div>
              <div className="flex items-center space-x-3">
                {priceHistory && priceHistory.length ? (
                  <div className="h-10 w-20">
                    <SimpleAreaChart
                      color={isUp ? COLORS.UP[theme] : COLORS.DOWN[theme]}
                      data={priceHistory}
                      name={baseBank!.name + quoteBank!.name}
                      xKey="time"
                      yKey="price"
                    />
                  </div>
                ) : (
                  <p className="mb-0 text-th-fgd-4">{t('unavailable')}</p>
                )}
                <Change change={change} suffix="%" />
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
                    {price ? (
                      <>
                        <FormatNumericValue
                          value={price}
                          isUsd={quoteBank?.name === 'USDC'}
                        />{' '}
                        {quoteBank?.name !== 'USDC' ? (
                          <span className="font-body text-th-fgd-4">
                            {quoteBank?.name}
                          </span>
                        ) : null}
                      </>
                    ) : (
                      '-'
                    )}
                  </p>
                </div>
                <div className="col-span-1">
                  <p className="text-xs text-th-fgd-3">
                    {t('trade:24h-volume')}
                  </p>
                  <p className="font-mono text-th-fgd-2">
                    {volume ? (
                      <span>
                        {numberCompacter.format(volume)}{' '}
                        <span className="font-body text-th-fgd-4">
                          {quoteBank?.name}
                        </span>
                      </span>
                    ) : (
                      <span>
                        0{' '}
                        <span className="font-body text-th-fgd-4">
                          {quoteBank?.name}
                        </span>
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </Disclosure.Panel>
          </Transition>
        </>
      )}
    </Disclosure>
  )
}
