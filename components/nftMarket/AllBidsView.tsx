import Button from '@components/shared/Button'
import { useTranslation } from 'next-i18next'
import { useState } from 'react'
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
import { Bid } from '@metaplex-foundation/js'

const AllBidsView = () => {
  const wallet = useWallet()
  const { data: auctionHouse } = useAuctionHouse()
  const metaplex = metaplexStore((s) => s.metaplex)
  const { t } = useTranslation(['nftMarket'])
  const [myBidsModal, setMyBidsModal] = useState(false)
  const { data: bids, refetch } = useBids()
  const bidsToLoad = bids ? bids : []
  const { data: loadedBids } = useLoadBids(bidsToLoad)

  const cancelBid = async (bid: Bid) => {
    await metaplex!.auctionHouse().cancelBid({
      auctionHouse: auctionHouse!,
      bid,
    })
    refetch()
  }
  return (
    <div className="flex flex-col">
      <div className="mr-5 flex space-x-4 p-4">
        <Button onClick={() => setMyBidsModal(true)}>{t('my-bids')}</Button>
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
              {wallet.publicKey && !x.buyerAddress.equals(wallet.publicKey) && (
                <>
                  <Button onClick={() => null}>{t('sell')}</Button>
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
