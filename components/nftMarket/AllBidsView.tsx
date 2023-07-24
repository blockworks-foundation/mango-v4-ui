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
import { NoSymbolIcon } from '@heroicons/react/20/solid'

const AllBidsView = () => {
  const { publicKey } = useWallet()
  const { data: auctionHouse } = useAuctionHouse()
  const metaplex = metaplexStore((s) => s.metaplex)
  // const { t } = useTranslation(['nft-market'])
  const [showBidModal, setShowBidModal] = useState(false)
  const [bidListing, setBidListing] = useState<null | Listing>(null)
  const { data: bids, refetch } = useBids()
  const bidsToLoad = bids ? bids : []
  const { data: loadedBids } = useLoadBids(bidsToLoad)
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
    await metaplex!.auctionHouse().cancelBid({
      auctionHouse: auctionHouse!,
      bid,
    })
    refetch()
  }

  const sellAsset = async (bid: Bid, tokenAccountPk: string) => {
    console.log(tokenAccountPk)
    const tokenAccount = await metaplex
      ?.tokens()
      .findTokenByAddress({ address: new PublicKey(tokenAccountPk) })

    await metaplex!.auctionHouse().sell({
      auctionHouse: auctionHouse!,
      bid: bid as PublicBid,
      sellerToken: tokenAccount!,
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
    setShowBidModal(true)
  }

  return (
    <>
      <div className="flex flex-col">
        {loadedBids?.length ? (
          <Table>
            <thead>
              <TrHead>
                <Th className="text-left">Date</Th>
                <Th className="text-right">NFT</Th>
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
                      nft.asset.mint.toString() === x.asset.mint.toString(),
                  )
                  return (
                    <TrBody key={idx}>
                      <Td>
                        <TableDateDisplay
                          date={x.createdAt.toNumber()}
                          showSeconds
                        />
                      </Td>
                      <Td>
                        <div className="flex justify-end">
                          <ImgWithLoader
                            className="w-12 rounded-md"
                            alt={x.asset.name}
                            src={x.asset.json!.image!}
                          />
                        </div>
                      </Td>
                      <Td>
                        <p className="text-right">
                          {toUiDecimals(
                            x.price.basisPoints.toNumber(),
                            MANGO_MINT_DECIMALS,
                          )}
                          <span className="font-body">{' MNGO'}</span>
                        </p>
                      </Td>
                      <Td>
                        <p className="text-right">
                          <p className="text-right">
                            {listing ? (
                              <>
                                {toUiDecimals(
                                  listing.price.basisPoints.toNumber(),
                                  MANGO_MINT_DECIMALS,
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
                              text="Accept Offer"
                            />
                          ) : (
                            <>
                              {publicKey && x.buyerAddress.equals(publicKey) ? (
                                <NftMarketButton
                                  colorClass="error"
                                  text="Cancel Offer"
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
                                  text="Buy Now"
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
        ) : (
          <div className="mt-4 flex flex-col items-center rounded-md border border-th-bkg-3 p-4">
            <NoSymbolIcon className="mb-1 h-7 w-7 text-th-fgd-4" />
            <p>No offers to show...</p>
          </div>
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
