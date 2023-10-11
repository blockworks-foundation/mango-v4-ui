import { useQuery } from '@tanstack/react-query'
import {
  fetchAuctionHouse,
  fetchFilteredListing,
  fetchFilteredBids,
} from 'apis/market/auctionHouse'
import metaplexStore from '@store/metaplexStore'
import { Bid, LazyBid, LazyListing } from '@metaplex-foundation/js'

export const ALL_FILTER = 'All'
export const YOUR_LISTINGS = 'Your Listings'
export const PRICE_LOW_HIGH = 'Price: Low to High'
//10min
const refetchMs = 600000

export function useAuctionHouse() {
  const metaplex = metaplexStore((s) => s.metaplex)
  const criteria = metaplex?.cluster

  return useQuery(
    ['auctionHouse', criteria],
    () => fetchAuctionHouse(metaplex!),
    {
      enabled: !!metaplex,
      staleTime: refetchMs,
      retry: 1,
      refetchInterval: refetchMs,
    },
  )
}

export function useLazyListings(filter = ALL_FILTER, page = 1, perPage = 9) {
  const metaplex = metaplexStore((s) => s.metaplex)
  const { data } = useAuctionHouse()
  const criteria = metaplex && [
    data?.address.toBase58(),
    filter,
    metaplex.identity().publicKey.toBase58(),
    page,
  ]

  return useQuery(
    ['lazyListings', criteria],
    () => fetchFilteredListing(metaplex!, data!, filter, page, perPage),
    {
      enabled: !!(metaplex && data),
      staleTime: refetchMs,
      retry: 1,
      refetchInterval: refetchMs,
    },
  )
}

export function useListings(filter = ALL_FILTER, page = 1) {
  const { data: lazyListings } = useLazyListings(filter, page)
  const metaplex = metaplexStore((s) => s.metaplex)
  const criteria = lazyListings?.results
    ? [...lazyListings.results!.map((x) => x.tradeStateAddress.toBase58())]
    : []

  const loadMetadatas = async (
    lazyListings: LazyListing[],
    totalPages: number,
  ) => {
    const listingsWithMeta = []
    for (const listing of lazyListings) {
      const listingWithMeta = await metaplex!.auctionHouse().loadListing({
        lazyListing: {
          ...listing,
        },
        loadJsonMetadata: true,
      })

      listingsWithMeta.push({ ...listingWithMeta })
    }

    return { results: listingsWithMeta, totalPages: totalPages }
  }

  return useQuery(
    ['listings', criteria],
    () => loadMetadatas(lazyListings!.results!, lazyListings!.totalPages),
    {
      enabled: !!(metaplex && lazyListings?.results),
      staleTime: refetchMs,
      retry: 1,
      refetchInterval: refetchMs,
    },
  )
}

export function useBids() {
  const metaplex = metaplexStore((s) => s.metaplex)
  const { data } = useAuctionHouse()
  const criteria = metaplex && data?.address.toBase58()

  return useQuery(
    ['bids', criteria],
    () => fetchFilteredBids(metaplex!, data!),
    {
      enabled: !!(metaplex && data),
      staleTime: refetchMs,
      retry: 1,
      refetchInterval: refetchMs,
    },
  )
}

export function useLoadBids(lazyBids: LazyBid[]) {
  const metaplex = metaplexStore((s) => s.metaplex)
  const criteria = [...lazyBids.map((x) => x.createdAt.toNumber())]

  const loadBids = async (lazyBids: LazyBid[]) => {
    const bids: Bid[] = []
    for (const lazyBid of lazyBids) {
      const bid = await metaplex!.auctionHouse().loadBid({
        lazyBid: {
          ...lazyBid,
        },
        loadJsonMetadata: true,
      })

      bids.push({ ...bid })
    }
    return bids
  }

  return useQuery(['loadedBids', criteria], () => loadBids(lazyBids), {
    enabled: !!(metaplex && lazyBids.length),
    staleTime: refetchMs,
    retry: 1,
    refetchInterval: refetchMs,
  })
}
