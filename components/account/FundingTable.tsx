import { Bank, PerpMarket } from '@blockworks-foundation/mango-v4'
import { LinkButton } from '@components/shared/Button'
import ConnectEmptyState from '@components/shared/ConnectEmptyState'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import SheenLoader from '@components/shared/SheenLoader'
import {
  SortableColumnHeader,
  Table,
  TableDateDisplay,
  Td,
  Th,
  TrBody,
  TrHead,
} from '@components/shared/TableElements'
import TokenLogo from '@components/shared/TokenLogo'
import MarketLogos from '@components/trade/MarketLogos'
import { Disclosure, Transition } from '@headlessui/react'
import { NoSymbolIcon } from '@heroicons/react/20/solid'
import { useWallet } from '@solana/wallet-adapter-react'
import mangoStore from '@store/mangoStore'
import { useInfiniteQuery } from '@tanstack/react-query'
import useMangoAccount from 'hooks/useMangoAccount'
import { useSortableData } from 'hooks/useSortableData'
import { useViewport } from 'hooks/useViewport'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  MarginFundingFeed,
  isCollateralFundingItem,
  isPerpFundingItem,
} from 'types'
import { MANGO_DATA_API_URL, PAGINATION_PAGE_LENGTH } from 'utils/constants'
import { breakpoints } from 'utils/theme'

type FundingItem = {
  asset: string
  amount: number
  marketOrBank: PerpMarket | Bank | undefined
  time: string
  type: string
  value?: number
}

export const fetchMarginFunding = async (
  mangoAccountPk: string,
  offset = 0,
  noLimit?: boolean,
) => {
  const params = noLimit ? '' : `&limit=${PAGINATION_PAGE_LENGTH}`
  try {
    const response = await fetch(
      `${MANGO_DATA_API_URL}/stats/margin-funding?mango-account=${mangoAccountPk}&offset=${offset}${params}`,
    )
    const parsedResponse = await response.json()

    if (Array.isArray(parsedResponse)) {
      return parsedResponse
    }
    return []
  } catch (e) {
    console.error('Failed to fetch account margin funding', e)
  }
}

const FundingTable = () => {
  const { t } = useTranslation(['common', 'account'])
  const { mangoAccountAddress } = useMangoAccount()
  const { connected } = useWallet()
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false

  const {
    data: fundingData,
    isLoading,
    // isFetching,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery(
    ['margin-funding', mangoAccountAddress],
    ({ pageParam }) => fetchMarginFunding(mangoAccountAddress, pageParam),
    {
      cacheTime: 1000 * 60 * 10,
      staleTime: 1000 * 60 * 5,
      retry: 3,
      refetchOnWindowFocus: false,
      keepPreviousData: true,
      getNextPageParam: (_lastPage, pages) =>
        pages.length * PAGINATION_PAGE_LENGTH,
    },
  )

  const tableData: FundingItem[] = useMemo(() => {
    if (!fundingData || !fundingData?.pages.length) return []
    const group = mangoStore.getState().group
    const data: FundingItem[] = []
    fundingData.pages.flat().forEach((item: MarginFundingFeed) => {
      const time = item.date_time
      if (isPerpFundingItem(item)) {
        const asset = item.activity_details.perp_market
        const amount =
          item.activity_details.long_funding +
          item.activity_details.short_funding
        const type = 'Perp'
        const market = group?.getPerpMarketByName(asset)
        const perpFundingItem = {
          asset,
          amount,
          marketOrBank: market,
          type,
          time,
        }
        if (Math.abs(amount) > 0) {
          data.push(perpFundingItem)
        }
      }
      if (isCollateralFundingItem(item)) {
        const asset = item.activity_details.symbol
        const amount = item.activity_details.fee_tokens * -1
        const value = item.activity_details.fee_value_usd * -1
        const type = 'Collateral'
        const bank = group?.banksMapByName.get(asset)?.[0]
        const collateralFundingItem = {
          asset,
          amount,
          marketOrBank: bank,
          type,
          time,
          value,
        }
        data.push(collateralFundingItem)
      }
    })
    data.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    return data
  }, [fundingData])

  const {
    items: sortedTableData,
    requestSort,
    sortConfig,
  } = useSortableData(tableData)

  return mangoAccountAddress &&
    (sortedTableData?.length || isLoading || isFetchingNextPage) ? (
    <>
      {showTableView ? (
        <Table>
          <thead>
            <TrHead>
              <Th className="text-left">
                <SortableColumnHeader
                  sortKey="time"
                  sort={() => requestSort('time')}
                  sortConfig={sortConfig}
                  title={t('date')}
                />
              </Th>
              <Th>
                <div className="flex justify-end">
                  <SortableColumnHeader
                    sortKey="asset"
                    sort={() => requestSort('asset')}
                    sortConfig={sortConfig}
                    title={t('asset')}
                  />
                </div>
              </Th>
              <Th>
                <div className="flex justify-end">
                  <SortableColumnHeader
                    sortKey="type"
                    sort={() => requestSort('type')}
                    sortConfig={sortConfig}
                    title={t('account:funding-type')}
                  />
                </div>
              </Th>
              <Th>
                <div className="flex justify-end">
                  <SortableColumnHeader
                    sortKey="amount"
                    sort={() => requestSort('amount')}
                    sortConfig={sortConfig}
                    title={t('amount')}
                  />
                </div>
              </Th>
            </TrHead>
          </thead>
          <tbody>
            {sortedTableData.map((item, i) => {
              const { asset, amount, marketOrBank, time, type, value } = item
              return (
                <TrBody key={asset + amount + i}>
                  <Td>
                    <TableDateDisplay date={time} />
                  </Td>
                  <Td>
                    <div className="flex items-center justify-end">
                      {marketOrBank ? (
                        marketOrBank instanceof PerpMarket ? (
                          <MarketLogos market={marketOrBank} size="small" />
                        ) : (
                          <div className="mr-1.5">
                            <TokenLogo bank={marketOrBank} size={16} />
                          </div>
                        )
                      ) : null}
                      <p className="font-body">{asset}</p>
                    </div>
                  </Td>
                  <Td>
                    <p className="text-right font-body">{type}</p>
                  </Td>
                  <Td>
                    <p>
                      {type === 'Perp' ? (
                        <span
                          className={`flex flex-col items-end ${
                            amount > 0 ? 'text-th-up' : 'text-th-down'
                          }`}
                        >
                          <FormatNumericValue value={amount} isUsd />
                        </span>
                      ) : (
                        <span className="flex flex-col items-end">
                          <span className="text-th-down">
                            <FormatNumericValue value={amount} />{' '}
                            <span className="font-body text-th-fgd-4">
                              {asset}
                            </span>
                          </span>
                          {value ? (
                            <span className="text-xs text-th-fgd-4">
                              <FormatNumericValue value={value} isUsd />
                            </span>
                          ) : null}
                        </span>
                      )}
                    </p>
                  </Td>
                </TrBody>
              )
            })}
          </tbody>
        </Table>
      ) : (
        sortedTableData.map((item, i) => {
          const { asset, amount, marketOrBank, time, type, value } = item
          return (
            <Disclosure key={asset + amount + i}>
              <>
                <Disclosure.Button
                  className={`w-full border-b border-th-bkg-3 p-4 text-left first:border-t-0 focus:outline-none`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <TableDateDisplay date={time} />
                    </div>
                    <div>
                      <div className="mb-0.5 flex items-center justify-end">
                        {marketOrBank ? (
                          marketOrBank instanceof PerpMarket ? (
                            <MarketLogos market={marketOrBank} size="small" />
                          ) : (
                            <div className="mr-1.5">
                              <TokenLogo bank={marketOrBank} size={16} />
                            </div>
                          )
                        ) : null}
                        <p className="text-right">{asset}</p>
                      </div>
                      <p className="font-mono">
                        {type === 'Perp' ? (
                          <span
                            className={`flex flex-col items-end ${
                              amount > 0 ? 'text-th-up' : 'text-th-down'
                            }`}
                          >
                            <FormatNumericValue value={amount} isUsd />
                          </span>
                        ) : (
                          <span className="flex flex-col items-end">
                            <span className="text-th-down">
                              <FormatNumericValue value={amount} />{' '}
                              <span className="font-body text-th-fgd-4">
                                {asset}
                              </span>
                            </span>
                            {value ? (
                              <span className="text-xs text-th-fgd-4">
                                <FormatNumericValue value={value} isUsd />
                              </span>
                            ) : null}
                          </span>
                        )}
                      </p>
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
                          {t('available')}
                        </p>
                      </div>
                    </div>
                  </Disclosure.Panel>
                </Transition>
              </>
            </Disclosure>
          )
        })
      )}
      {isLoading || isFetchingNextPage ? (
        <div className="mt-2 space-y-2 px-4 md:px-6">
          {[...Array(20)].map((x, i) => (
            <SheenLoader className="flex flex-1" key={i}>
              <div className="h-16 w-full rounded-md bg-th-bkg-2" />
            </SheenLoader>
          ))}
        </div>
      ) : null}
      {tableData.length && !(tableData.length % PAGINATION_PAGE_LENGTH) ? (
        <LinkButton className="mx-auto my-6" onClick={() => fetchNextPage()}>
          {t('show-more')}
        </LinkButton>
      ) : null}
    </>
  ) : mangoAccountAddress || connected ? (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="flex flex-col items-center p-8">
        <NoSymbolIcon className="mb-2 h-6 w-6 text-th-fgd-4" />
        <p>{t('account:no-funding')}</p>
      </div>
    </div>
  ) : (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <ConnectEmptyState text={t('account:connect-funding')} />
    </div>
  )
}

export default FundingTable
