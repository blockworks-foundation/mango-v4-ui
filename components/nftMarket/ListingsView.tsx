import { toUiDecimals } from '@blockworks-foundation/mango-v4'
import Select from '@components/forms/Select'
import BidNftModal from '@components/nftMarket/BidNftModal'
import AssetBidsModal from '@components/nftMarket/AssetBidsModal'
import { Listing } from '@metaplex-foundation/js'
import { useWallet } from '@solana/wallet-adapter-react'
import metaplexStore from '@store/metaplexStore'
import {
  ALL_FILTER,
  PRICE_LOW_HIGH,
  YOUR_LISTINGS,
  useAuctionHouse,
  useBids,
  useLazyListings,
  useListings,
} from 'hooks/market/useAuctionHouse'
import { useEffect, useState } from 'react'
import { MANGO_MINT_DECIMALS } from 'utils/governance/constants'
// import { useTranslation } from 'next-i18next'
import { ImgWithLoader } from '@components/ImgWithLoader'
import NftMarketButton from './NftMarketButton'
import { formatNumericValue } from 'utils/numbers'
import Loading from '@components/shared/Loading'
import SheenLoader from '@components/shared/SheenLoader'
import EmptyState from './EmptyState'
import { notify } from 'utils/notifications'
import ResponsivePagination from 'react-responsive-pagination'

const PRICE_HIGH_LOW = 'Price: High to Low'
const defaultFilters = [
  ALL_FILTER,
  YOUR_LISTINGS,
  PRICE_LOW_HIGH,
  PRICE_HIGH_LOW,
]

const ListingsView = () => {
  const { publicKey } = useWallet()
  const metaplex = metaplexStore((s) => s.metaplex)
  // const { t } = useTranslation(['nft-market'])
  const [currentFilter, setCurrentFilter] = useState(ALL_FILTER)
  const { data: bids } = useBids()
  const [bidListing, setBidListing] = useState<null | Listing>(null)
  const [assetBidsListing, setAssetBidsListing] = useState<null | Listing>(null)
  const { data: auctionHouse } = useAuctionHouse()
  const [asssetBidsModal, setAssetBidsModal] = useState(false)
  const [bidNftModal, setBidNftModal] = useState(false)
  const [cancellingListing, setCancellingListing] = useState('')
  const [buying, setBuying] = useState('')
  const [page, setPage] = useState(1)

  const { refetch } = useLazyListings()
  const {
    data: listings,
    isLoading: loadingListings,
    isFetching: fetchingListings,
  } = useListings(currentFilter, page)
  const [listingsToShow, setListingsToShow] = useState<Listing[] | undefined>(
    undefined,
  )

  useEffect(() => {
    if (!loadingListings && !fetchingListings) {
      setListingsToShow(listings ? listings.results : [])
    }
  }, [listings, loadingListings, fetchingListings])

  const cancelListing = async (listing: Listing) => {
    setCancellingListing(listing.asset.mint.address.toString())
    try {
      const { response } = await metaplex!.auctionHouse().cancelListing({
        auctionHouse: auctionHouse!,
        listing: listing,
      })
      refetch()
      if (response) {
        notify({
          title: 'Transaction confirmed',
          type: 'success',
          txid: response.signature,
        })
      }
    } catch (e) {
      console.log('error cancelling listing', e)
    } finally {
      setCancellingListing('')
    }
  }

  const buyAsset = async (listing: Listing) => {
    setBuying(listing.asset.mint.address.toString())
    try {
      const { response } = await metaplex!.auctionHouse().buy({
        auctionHouse: auctionHouse!,
        listing,
      })
      refetch()
      if (response) {
        notify({
          title: 'Transaction confirmed',
          type: 'success',
          txid: response.signature,
        })
      }
    } catch (e) {
      console.log('error buying nft', e)
    } finally {
      setBuying('')
    }
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
  const handlePageClick = (page: number) => {
    setPage(page)
  }

  const filters = defaultFilters

  const handleFilter = (filter: string) => {
    setCurrentFilter(filter)
  }
  const loading = loadingListings || fetchingListings

  return (
    <div>
      <div className="mb-4 mt-2 flex items-center justify-between rounded-md bg-th-bkg-2 p-2 pl-4">
        <h3 className="text-sm font-normal text-th-fgd-3">{`Filter Results`}</h3>
        <Select
          value={currentFilter}
          onChange={(filter) => handleFilter(filter)}
          className="w-[180px]"
        >
          {filters.map((filter) => (
            <Select.Option key={filter} value={filter}>
              <div className="flex w-full items-center justify-between">
                {filter}
              </div>
            </Select.Option>
          ))}
        </Select>
      </div>
      <div className="grid grid-flow-row auto-rows-max grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
        {listingsToShow && listingsToShow.length ? (
          listingsToShow.map((x, idx) => {
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
              <div
                className="col-span-1 rounded-lg border border-th-bkg-3"
                key={idx}
              >
                {imgSource ? (
                  <div className="flex h-60 w-full items-center overflow-hidden rounded-t-lg">
                    <ImgWithLoader
                      alt="nft"
                      className="h-auto w-full shrink-0"
                      src={imgSource}
                    />
                  </div>
                ) : null}
                <div className="p-4">
                  <h3 className="text-sm text-th-fgd-2">
                    {x.asset.json?.name || x.asset.name || 'Unknown'}
                  </h3>
                  <p className="mb-1.5 text-xs">
                    {x.asset.json?.collection?.family || 'Unknown'}
                  </p>
                  <div className="flex items-center">
                    <span className="font-display text-base">
                      {formatNumericValue(
                        toUiDecimals(
                          x.price.basisPoints.toNumber(),
                          MANGO_MINT_DECIMALS,
                        ),
                      )}{' '}
                      <span className="font-body font-bold">MNGO</span>
                    </span>
                  </div>
                  <div>
                    <p className="text-xs">
                      {bestBid ? `Best Offer: ${bestBid} MNGO` : 'No offers'}
                    </p>
                  </div>
                  {publicKey && !x.sellerAddress.equals(publicKey) && (
                    <div className="mt-3 space-y-2 border-t border-th-bkg-3 pt-4">
                      <NftMarketButton
                        className="w-full"
                        text={
                          buying === x.asset.mint.address.toString() ? (
                            <Loading />
                          ) : (
                            'Buy Now'
                          )
                        }
                        colorClass="success"
                        onClick={() => buyAsset(x)}
                      />
                      <NftMarketButton
                        className="w-full"
                        text="Make Offer"
                        colorClass="fgd-3"
                        onClick={() => openBidModal(x)}
                      />
                    </div>
                  )}
                  {publicKey && x.sellerAddress.equals(publicKey) && (
                    <div className="mt-3 space-y-2 border-t border-th-bkg-3 pt-4">
                      <NftMarketButton
                        className="w-full"
                        text={
                          cancellingListing ===
                          x.asset.mint.address.toString() ? (
                            <Loading />
                          ) : (
                            'Delist'
                          )
                        }
                        colorClass="error"
                        onClick={() => cancelListing(x)}
                      />
                      <NftMarketButton
                        className="w-full"
                        text={`Offers (${nftBids?.length})`}
                        colorClass="fgd-3"
                        onClick={() => openBidsModal(x)}
                      />
                    </div>
                  )}
                </div>
              </div>
            )
          })
        ) : loading ? (
          [...Array(4)].map((x, i) => (
            <SheenLoader className="flex flex-1" key={i}>
              <div className="col-span-1 h-64 w-full bg-th-bkg-2" />
            </SheenLoader>
          ))
        ) : (
          <div className="col-span-5">
            <EmptyState text="No listings to display..." />
          </div>
        )}
      </div>
      <div>
        <ResponsivePagination
          current={page}
          total={listings?.totalPages || 0}
          onPageChange={handlePageClick}
        />
      </div>
      {asssetBidsModal && assetBidsListing ? (
        <AssetBidsModal
          listing={assetBidsListing}
          isOpen={asssetBidsModal}
          onClose={closeBidsModal}
        />
      ) : null}
      {bidNftModal && bidListing ? (
        <BidNftModal
          listing={bidListing}
          isOpen={bidNftModal}
          onClose={closeBidModal}
        />
      ) : null}
    </div>
  )
}

export default ListingsView
