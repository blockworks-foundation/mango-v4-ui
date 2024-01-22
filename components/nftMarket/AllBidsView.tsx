// import { useTranslation } from 'next-i18next'
import { useEffect, useState } from 'react'
import {
  useAuctionHouse,
  useBids,
  useListings,
  useLoadBids,
} from 'hooks/market/useAuctionHouse'
import { toUiDecimals } from '@blockworks-foundation/mango-v4'
import { MANGO_MINT_DECIMALS } from 'utils/governance/constants'
import { useWallet } from '@solana/wallet-adapter-react'
import metaplexStore from '@store/metaplexStore'
import { Bid, Listing, PublicBid, PublicKey } from '@metaplex-foundation/js'
import BidNftModal from './BidNftModal'
import mangoStore from '@store/mangoStore'
import {
  Table,
  TableDateDisplay,
  Td,
  Th,
  TrBody,
  TrHead,
} from '@components/shared/TableElements'
import { ImgWithLoader } from '@components/ImgWithLoader'
import NftMarketButton from './NftMarketButton'
import { abbreviateAddress } from 'utils/formatting'
import EmptyState from './EmptyState'
import { formatNumericValue } from 'utils/numbers'
import Loading from '@components/shared/Loading'
import { notify } from 'utils/notifications'
import SheenLoader from '@components/shared/SheenLoader'

const AllBidsView = () => {
  const { publicKey } = useWallet()
  const { data: auctionHouse } = useAuctionHouse()
  const metaplex = metaplexStore((s) => s.metaplex)
  // const { t } = useTranslation(['nft-market'])
  const [showBidModal, setShowBidModal] = useState(false)
  const [bidListing, setBidListing] = useState<null | Listing>(null)
  const [buying, setBuying] = useState('')
  const [cancellingBid, setCancellingBid] = useState('')
  const [accepting, setAccepting] = useState('')
  const { data: bids, refetch } = useBids()
  const bidsToLoad = bids ? bids : []
  const {
    data: loadedBids,
    isLoading: loadingBids,
    isFetching: fetchingBids,
  } = useLoadBids(bidsToLoad)
  const connection = mangoStore((s) => s.connection)
  const fetchNfts = mangoStore((s) => s.actions.fetchNfts)
  const nfts = mangoStore((s) => s.wallet.nfts.data)
  const { data: listings } = useListings()

  useEffect(() => {
    if (publicKey) {
      fetchNfts(connection, publicKey!)
    }
  }, [publicKey])

  const cancelBid = async (bid: Bid) => {
    setCancellingBid(bid.asset.mint.address.toString())
    try {
      const { response } = await metaplex!.auctionHouse().cancelBid({
        auctionHouse: auctionHouse!,
        bid,
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
      console.log('error cancelling bid', e)
    } finally {
      setCancellingBid('')
    }
  }

  const sellAsset = async (bid: Bid, tokenAccountPk: string) => {
    setAccepting(bid.asset.mint.address.toString())
    try {
      const tokenAccount = await metaplex
        ?.tokens()
        .findTokenByAddress({ address: new PublicKey(tokenAccountPk) })

      const { response } = await metaplex!.auctionHouse().sell({
        auctionHouse: auctionHouse!,
        bid: bid as PublicBid,
        sellerToken: tokenAccount!,
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
      console.log('error accepting offer', e)
    } finally {
      setAccepting('')
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
    setShowBidModal(true)
  }

  const loading = loadingBids || fetchingBids

  return (
    <>
      <div className="flex flex-col">
        {loadedBids && loadedBids?.length ? (
          <Table>
            <thead>
              <TrHead>
                <Th className="text-left">Date</Th>
                <Th className="text-left">NFT</Th>
                <Th className="text-right">Offer</Th>
                <Th className="text-right">Buy Now Price</Th>
                <Th className="text-right">Buyer</Th>
                <Th className="text-right">Actions</Th>
              </TrHead>
            </thead>
            <tbody>
              {loadedBids
                .sort((a, b) => b.createdAt.toNumber() - a.createdAt.toNumber())
                .map((x, idx) => {
                  const listing = listings?.results?.find(
                    (nft: Listing) =>
                      nft.asset.mint.address.toString() ===
                      x.asset.mint.address.toString(),
                  )
                  return (
                    <TrBody key={idx}>
                      <Td>
                        <TableDateDisplay
                          date={x.createdAt.toNumber() * 1000}
                          showSeconds
                        />
                      </Td>
                      <Td>
                        <div className="flex items-center justify-start">
                          <ImgWithLoader
                            className="mr-2 w-12 rounded-md"
                            alt={x.asset.name}
                            src={x.asset.json!.image!}
                          />
                          <div>
                            <p className="font-body">
                              {x.asset.json?.name || 'Unknown'}
                            </p>
                            <p className="font-body text-xs text-th-fgd-3">
                              {x.asset.json?.collection?.family || 'Unknown'}
                            </p>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <p className="text-right">
                          {formatNumericValue(
                            toUiDecimals(
                              x.price.basisPoints.toNumber(),
                              MANGO_MINT_DECIMALS,
                            ),
                          )}
                          <span className="font-body">{' MNGO'}</span>
                        </p>
                      </Td>
                      <Td>
                        <p className="text-right">
                          <p className="text-right">
                            {listing ? (
                              <>
                                {formatNumericValue(
                                  toUiDecimals(
                                    listing.price.basisPoints.toNumber(),
                                    MANGO_MINT_DECIMALS,
                                  ),
                                )}
                                <span className="font-body">{' MNGO'}</span>
                              </>
                            ) : (
                              '–'
                            )}
                          </p>
                        </p>
                      </Td>
                      <Td>
                        <p className="text-right">
                          {abbreviateAddress(x.buyerAddress)}
                        </p>
                      </Td>
                      <Td>
                        <div className="flex justify-end space-x-2">
                          {publicKey &&
                          !x.buyerAddress.equals(publicKey) &&
                          nfts.find(
                            (ownNft) =>
                              ownNft.mint === x.asset.address.toBase58(),
                          ) ? (
                            <NftMarketButton
                              onClick={() =>
                                sellAsset(
                                  x,
                                  nfts.find(
                                    (ownNft) =>
                                      ownNft.mint ===
                                      x.asset.address.toBase58(),
                                  )!.tokenAccount,
                                )
                              }
                              colorClass="fgd-3"
                              text={
                                accepting ===
                                x.asset.mint.address.toString() ? (
                                  <Loading />
                                ) : (
                                  'Accept Offer'
                                )
                              }
                            />
                          ) : (
                            <>
                              {publicKey && x.buyerAddress.equals(publicKey) ? (
                                <NftMarketButton
                                  colorClass="error"
                                  text={
                                    cancellingBid ===
                                    x.asset.mint.address.toString() ? (
                                      <Loading />
                                    ) : (
                                      'Cancel Offer'
                                    )
                                  }
                                  onClick={() => cancelBid(x)}
                                />
                              ) : listing ? (
                                <NftMarketButton
                                  colorClass="fgd-3"
                                  text="Make Offer"
                                  onClick={() => openBidModal(listing)}
                                />
                              ) : null}
                              {listing ? (
                                <NftMarketButton
                                  colorClass="success"
                                  text={
                                    buying ===
                                    listing.asset.mint.address.toString() ? (
                                      <Loading />
                                    ) : (
                                      'Buy Now'
                                    )
                                  }
                                  onClick={() => buyAsset(listing)}
                                />
                              ) : null}
                            </>
                          )}
                        </div>
                      </Td>
                    </TrBody>
                  )
                })}
            </tbody>
          </Table>
        ) : loading ? (
          <div className="mt-4 space-y-1.5">
            {[...Array(4)].map((x, i) => (
              <SheenLoader className="mx-4 flex flex-1 md:mx-6" key={i}>
                <div className="h-16 w-full bg-th-bkg-2" />
              </SheenLoader>
            ))}
          </div>
        ) : (
          <EmptyState text="No offers to display..." />
        )}
      </div>
      {showBidModal ? (
        <BidNftModal
          listing={bidListing ? bidListing : undefined}
          isOpen={showBidModal}
          onClose={() => setShowBidModal(false)}
        />
      ) : null}
    </>
  )
}

export default AllBidsView
