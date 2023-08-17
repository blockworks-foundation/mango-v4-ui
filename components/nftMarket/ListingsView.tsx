import { toUiDecimals } from '@blockworks-foundation/mango-v4'
import Select from '@components/forms/Select'
import BidNftModal from '@components/nftMarket/BidNftModal'
import AssetBidsModal from '@components/nftMarket/AssetBidsModal'
import { Listing } from '@metaplex-foundation/js'
import { useWallet } from '@solana/wallet-adapter-react'
import metaplexStore from '@store/metaplexStore'
import {
  ALL_FILTER,
  useAuctionHouse,
  useBids,
  useLazyListings,
  useListings,
} from 'hooks/market/useAuctionHouse'
import { useState } from 'react'
import { MANGO_MINT_DECIMALS } from 'utils/governance/constants'
// import { useTranslation } from 'next-i18next'
import { ImgWithLoader } from '@components/ImgWithLoader'
import NftMarketButton from './NftMarketButton'

const filter = [ALL_FILTER, 'My Listings']

const ListingsView = () => {
  const { publicKey } = useWallet()
  const metaplex = metaplexStore((s) => s.metaplex)
  // const { t } = useTranslation(['nft-market'])
  const [currentFilter, setCurrentFilter] = useState(ALL_FILTER)
  const { data: bids } = useBids()

  // const [page, setPage] = useState(1)
  const [bidListing, setBidListing] = useState<null | Listing>(null)
  const [assetBidsListing, setAssetBidsListing] = useState<null | Listing>(null)
  const { data: auctionHouse } = useAuctionHouse()
  const [asssetBidsModal, setAssetBidsModal] = useState(false)
  const [bidNftModal, setBidNftModal] = useState(false)

  const { refetch } = useLazyListings()
  // const { data: listings } = useListings(currentFilter, page)
  const { data: listings } = useListings()

  const cancelListing = async (listing: Listing) => {
    await metaplex!.auctionHouse().cancelListing({
      auctionHouse: auctionHouse!,
      listing: listing,
    })
    refetch()
  }

  const buyAsset = async (listing: Listing) => {
    await metaplex!.auctionHouse().buy({
      auctionHouse: auctionHouse!,
      listing,
    })
    refetch()
  }

  const openBidModal = (listing: Listing) => {
    setBidListing(listing)
    setBidNftModal(true)
  }
  const closeBidModal = () => {
    setBidNftModal(false)
    setBidListing(null)
  }
  const openBidsModal = (listing: Listing) => {
    setAssetBidsModal(true)
    setAssetBidsListing(listing)
  }
  const closeBidsModal = () => {
    setAssetBidsModal(false)
    setAssetBidsListing(null)
  }
  // const handlePageClick = (page: number) => {
  //   setPage(page)
  // }

  return (
    <div className="flex flex-col">
      <div className="mb-4 mt-2 flex items-center justify-between rounded-md bg-th-bkg-2 p-2 pl-4">
        <h3 className="text-sm font-normal text-th-fgd-3">{`Filter Results`}</h3>
        <Select
          value={currentFilter}
          onChange={(filter) => setCurrentFilter(filter)}
          className="w-[150px]"
        >
          {filter.map((filter) => (
            <Select.Option key={filter} value={filter}>
              <div className="flex w-full items-center justify-between">
                {filter}
              </div>
            </Select.Option>
          ))}
        </Select>
        {asssetBidsModal && assetBidsListing && (
          <AssetBidsModal
            listing={assetBidsListing}
            isOpen={asssetBidsModal}
            onClose={closeBidsModal}
          ></AssetBidsModal>
        )}
      </div>
      <div className="grid auto-cols-max grid-flow-row auto-rows-max gap-4">
        {listings?.results?.map((x, idx) => {
          const imgSource = x.asset.json?.image
          const nftBids = bids?.filter((bid) =>
            bid.metadataAddress.equals(x.asset.metadataAddress),
          )
          const bestBid = nftBids
            ? nftBids.reduce((a, c) => {
                const price = toUiDecimals(
                  c.price.basisPoints.toNumber(),
                  MANGO_MINT_DECIMALS,
                )
                if (price > a) {
                  a = price
                }
                return a
              }, 0)
            : 0
          return (
            <div className="w-60 rounded-lg border border-th-bkg-3" key={idx}>
              {imgSource ? (
                <div className="flex h-60 w-full items-start overflow-hidden rounded-t-lg">
                  <ImgWithLoader
                    alt="nft"
                    className="h-auto w-60 flex-shrink-0"
                    src={imgSource}
                  />
                </div>
              ) : null}
              <div className="p-4">
                <div className="flex justify-between">
                  <div>
                    <p className="text-xs">Buy Now</p>
                    <div className="flex items-center">
                      {/* <img
                        className="mr-1 h-3.5 w-auto"
                        src="/icons/mngo.svg"
                      /> */}
                      <span className="font-display text-base">
                        {toUiDecimals(
                          x.price.basisPoints.toNumber(),
                          MANGO_MINT_DECIMALS,
                        )}{' '}
                        <span className="font-body font-bold">MNGO</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="mt-2 text-xs">
                    {bestBid ? `Best Offer: ${bestBid} MNGO` : 'No offers'}
                  </p>
                </div>
                {publicKey && !x.sellerAddress.equals(publicKey) && (
                  <div className="mt-3 flex space-x-2 border-t border-th-bkg-3 pt-4">
                    <NftMarketButton
                      className="w-1/2"
                      text="Buy Now"
                      colorClass="success"
                      onClick={() => buyAsset(x)}
                    />
                    <NftMarketButton
                      className="w-1/2"
                      text="Make Offer"
                      colorClass="fgd-3"
                      onClick={() => openBidModal(x)}
                    />
                    {bidNftModal && bidListing && (
                      <BidNftModal
                        listing={bidListing}
                        isOpen={bidNftModal}
                        onClose={closeBidModal}
                      ></BidNftModal>
                    )}
                  </div>
                )}
                {publicKey && x.sellerAddress.equals(publicKey) && (
                  <div className="mt-3 flex space-x-2 border-t border-th-bkg-3 pt-4">
                    <NftMarketButton
                      className="w-1/2"
                      text="Delist"
                      colorClass="error"
                      onClick={() => cancelListing(x)}
                    />
                    <NftMarketButton
                      className="w-1/2"
                      text={`Offers (${nftBids?.length})`}
                      colorClass="fgd-3"
                      onClick={() => openBidsModal(x)}
                    />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      {/* <div>
        <ResponsivePagination
          current={page}
          total={listings?.totalPages || 0}
          onPageChange={handlePageClick}
        />
      </div> */}
    </div>
  )
}

export default ListingsView
