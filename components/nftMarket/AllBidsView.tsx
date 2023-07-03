import Button from '@components/shared/Button'
import { useTranslation } from 'next-i18next'
import { useEffect, useState } from 'react'
import MyBidsModal from './MyBidsModal'
import {
  useAuctionHouse,
  useBids,
  useLoadBids,
} from 'hooks/market/useAuctionHouse'
import { toUiDecimals } from '@blockworks-foundation/mango-v4'
import { MANGO_MINT_DECIMALS } from 'utils/governance/constants'
import { useWallet } from '@solana/wallet-adapter-react'
import metaplexStore from '@store/metaplexStore'
import { Bid, PublicBid, PublicKey } from '@metaplex-foundation/js'
import BidNftModal from './BidNftModal'
import mangoStore from '@store/mangoStore'

const AllBidsView = () => {
  const wallet = useWallet()
  const { data: auctionHouse } = useAuctionHouse()
  const metaplex = metaplexStore((s) => s.metaplex)
  const { t } = useTranslation(['nftMarket'])
  const [myBidsModal, setMyBidsModal] = useState(false)
  const [bidModal, setBidModal] = useState(false)
  const { data: bids, refetch } = useBids()
  const bidsToLoad = bids ? bids : []
  const { data: loadedBids } = useLoadBids(bidsToLoad)
  const connection = mangoStore((s) => s.connection)
  const fetchNfts = mangoStore((s) => s.actions.fetchNfts)
  const nfts = mangoStore((s) => s.wallet.nfts.data)

  useEffect(() => {
    if (wallet.publicKey) {
      fetchNfts(connection, wallet.publicKey!)
    }
  }, [wallet.publicKey])

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

  return (
    <div className="flex flex-col">
      <div className="mr-5 flex space-x-4 p-4">
        <Button onClick={() => setBidModal(true)}>{t('bid')}</Button>
        <Button onClick={() => setMyBidsModal(true)}>{t('my-bids')}</Button>
        {bidModal && (
          <BidNftModal
            isOpen={bidModal}
            onClose={() => setBidModal(false)}
          ></BidNftModal>
        )}
        {myBidsModal && (
          <MyBidsModal
            isOpen={myBidsModal}
            onClose={() => setMyBidsModal(false)}
          ></MyBidsModal>
        )}
      </div>
      <div className="flex p-4">
        {loadedBids?.map((x, idx) => (
          <div className="p-4" key={idx}>
            <img src={x.asset.json?.image}></img>
            <div>
              {t('bid')}:
              {toUiDecimals(
                x.price.basisPoints.toNumber(),
                MANGO_MINT_DECIMALS
              )}
              {' MNGO'}
            </div>
            <div className="space-x-4">
              {wallet.publicKey &&
                !x.buyerAddress.equals(wallet.publicKey) &&
                nfts.find(
                  (ownNft) => ownNft.mint === x.asset.address.toBase58()
                ) && (
                  <>
                    <Button
                      onClick={() =>
                        sellAsset(
                          x,
                          nfts.find(
                            (ownNft) =>
                              ownNft.mint === x.asset.address.toBase58()
                          )!.tokenAccount
                        )
                      }
                    >
                      {t('sell')}
                    </Button>
                  </>
                )}
              {wallet.publicKey && x.buyerAddress.equals(wallet.publicKey) && (
                <>
                  <Button onClick={() => cancelBid(x)}>
                    {t('cancel-bid')}
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AllBidsView
