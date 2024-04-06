import { Bank, PerpMarket } from '@blockworks-foundation/mango-v4'
import { LinkButton } from '@components/shared/Button'
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
import MarketLogos from '@components/trade/MarketLogos'
import mangoStore from '@store/mangoStore'
import { useInfiniteQuery } from '@tanstack/react-query'
import useMangoAccount from 'hooks/useMangoAccount'
import { useSortableData } from 'hooks/useSortableData'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { MarginFundingFeed, isPerpFundingItem } from 'types'
import { MANGO_DATA_API_URL, PAGINATION_PAGE_LENGTH } from 'utils/constants'
import { formatCurrencyValue } from 'utils/numbers'

type FundingItem = {
  asset: string
  amount: number
  marketOrBank: PerpMarket | Bank | undefined
  time: string
  type: string
}

const fetchMarginFunding = async (mangoAccountPk: string, offset = 0) => {
  try {
    const response = await fetch(
      `${MANGO_DATA_API_URL}/stats/margin-funding?mango-account=${mangoAccountPk}&offset=${offset}&limit=${PAGINATION_PAGE_LENGTH}`,
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

  console.log(fundingData)

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
    })
    data.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    return data
  }, [fundingData])

  const {
    items: sortedTableData,
    requestSort,
    sortConfig,
  } = useSortableData(tableData)

  return (
    <>
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
            const { asset, amount, marketOrBank, time, type } = item
            return (
              <TrBody key={asset + amount + i}>
                <Td>
                  <TableDateDisplay date={time} showSeconds />
                </Td>
                <Td>
                  <div className="flex items-center justify-end">
                    {marketOrBank instanceof PerpMarket ? (
                      <MarketLogos market={marketOrBank} />
                    ) : null}
                    <p className="font-body">{asset}</p>
                  </div>
                </Td>
                <Td>
                  <p className="text-right">{type}</p>
                </Td>
                <Td>
                  <p className="text-right">{formatCurrencyValue(amount)}</p>
                </Td>
              </TrBody>
            )
          })}
        </tbody>
      </Table>
      {isLoading || isFetchingNextPage ? (
        <div className="mt-2 space-y-2 px-4 md:px-6">
          {[...Array(20)].map((x, i) => (
            <SheenLoader className="flex flex-1" key={i}>
              <div className="h-16 w-full rounded-md bg-th-bkg-2" />
            </SheenLoader>
          ))}
        </div>
      ) : null}
      {tableData.length ? (
        <LinkButton className="mx-auto my-6" onClick={() => fetchNextPage()}>
          {t('show-more')}
        </LinkButton>
      ) : null}
    </>
  )
}

export default FundingTable
