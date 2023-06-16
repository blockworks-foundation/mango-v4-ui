import {
  AuctionHouse,
  Metaplex,
  LazyListing,
  LazyBid,
} from '@metaplex-foundation/js'
import { AUCTION_HOUSE_ID } from 'utils/constants'

export const fetchAuctionHouse = async (metaplex: Metaplex) => {
  const auctionHouse = await metaplex
    .auctionHouse()
    .findByAddress({ address: AUCTION_HOUSE_ID })
  return auctionHouse
}

export const fetchFilteredListing = async (
  metaplex: Metaplex,
  auctionHouse: AuctionHouse
) => {
  const listings = (
    await metaplex.auctionHouse().findListings({
      auctionHouse,
    })
  ).filter((x) => !x.canceledAt && !x.purchaseReceiptAddress) as LazyListing[]
  return listings
}

export const fetchFilteredBids = async (
  metaplex: Metaplex,
  auctionHouse: AuctionHouse
) => {
  const bids = await metaplex.auctionHouse().findBids({
    auctionHouse,
  })
  return bids.filter(
    (x) => !x.canceledAt && !x.purchaseReceiptAddress
  ) as LazyBid[]
}
