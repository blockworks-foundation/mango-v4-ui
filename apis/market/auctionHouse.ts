import { toUiDecimals } from '@blockworks-foundation/mango-v4'
import {
  AuctionHouse,
  Metaplex,
  LazyListing,
  LazyBid,
} from '@metaplex-foundation/js'
import {
  ALL_FILTER,
  PRICE_LOW_HIGH,
  YOUR_LISTINGS,
} from 'hooks/market/useAuctionHouse'
import { AUCTION_HOUSE_ID } from 'utils/constants'
import { MANGO_MINT_DECIMALS } from 'utils/governance/constants'

export const fetchAuctionHouse = async (metaplex: Metaplex) => {
  const auctionHouse = await metaplex
    .auctionHouse()
    .findByAddress({ address: AUCTION_HOUSE_ID })
  return auctionHouse
}

export const fetchFilteredListing = async (
  metaplex: Metaplex,
  auctionHouse: AuctionHouse,
  filter: string,
  page: number,
  perPage: number,
) => {
  const listings = (
    await metaplex.auctionHouse().findListings({
      auctionHouse,
    })
  )
    .filter((x) => {
      if (filter === ALL_FILTER || filter.includes('Price')) {
        return true
      }
      if (filter === YOUR_LISTINGS) {
        return x.sellerAddress.equals(metaplex.identity().publicKey)
      }
    })
    .filter((x) => !x.canceledAt && !x.purchaseReceiptAddress)
    .sort((a, b) => {
      if (filter.includes('Price')) {
        const aPrice = toUiDecimals(
          a.price.basisPoints.toNumber(),
          MANGO_MINT_DECIMALS,
        )
        const bPrice = toUiDecimals(
          b.price.basisPoints.toNumber(),
          MANGO_MINT_DECIMALS,
        )
        return filter === PRICE_LOW_HIGH ? aPrice - bPrice : bPrice - aPrice
      }

      return b.createdAt.toNumber() - a.createdAt.toNumber()
    })

  const filteredListings = listings.slice(
    (page - 1) * perPage,
    page * perPage,
  ) as LazyListing[]

  return {
    results: filteredListings,
    totalPages: Math.ceil(listings.length / perPage),
  }
}

export const fetchFilteredBids = async (
  metaplex: Metaplex,
  auctionHouse: AuctionHouse,
) => {
  const bids = await metaplex.auctionHouse().findBids({
    auctionHouse,
  })
  return bids.filter(
    (x) => !x.canceledAt && !x.purchaseReceiptAddress,
  ) as LazyBid[]
}
