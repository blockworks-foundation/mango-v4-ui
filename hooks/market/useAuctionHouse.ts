import { useQuery } from '@tanstack/react-query'
import {
  fetchAuctionHouse,
  fetchFilteredListing,
} from 'apis/market/auctionHouse'
import metaplexStore from '@store/metaplexStore'
import { LazyListing } from '@metaplex-foundation/js'

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
    }
  )
}

export function useLazyListings() {
  const metaplex = metaplexStore((s) => s.metaplex)
  const { data } = useAuctionHouse()
  const criteria = metaplex && data?.address.toBase58()

  return useQuery(
    ['lazyListings', criteria],
    () => fetchFilteredListing(metaplex!, data!),
    {
      enabled: !!(metaplex && data),
      staleTime: refetchMs,
      retry: 1,
      refetchInterval: refetchMs,
    }
  )
}

export function useListings() {
  const { data: lazyListings } = useLazyListings()
  const metaplex = metaplexStore((s) => s.metaplex)
  const criteria = lazyListings
    ? [...lazyListings!.map((x) => x.tradeStateAddress.toBase58())]
    : []

  const loadMetadatas = async (lazyListings: LazyListing[]) => {
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
    return listingsWithMeta
  }

  return useQuery(['listings', criteria], () => loadMetadatas(lazyListings!), {
    enabled: !!(metaplex && lazyListings),
    staleTime: refetchMs,
    retry: 1,
    refetchInterval: refetchMs,
  })
}
