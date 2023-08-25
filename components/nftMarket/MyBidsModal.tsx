import { useWallet } from '@solana/wallet-adapter-react'
import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import {
  useAuctionHouse,
  useBids,
  useLoadBids,
} from 'hooks/market/useAuctionHouse'
import { toUiDecimals } from '@blockworks-foundation/mango-v4'
import { MANGO_MINT_DECIMALS } from 'utils/governance/constants'
import { ImgWithLoader } from '@components/ImgWithLoader'
import metaplexStore from '@store/metaplexStore'
import { Bid } from '@metaplex-foundation/js'
import { useTranslation } from 'next-i18next'
import NftMarketButton from './NftMarketButton'
import { useState } from 'react'
import Loading from '@components/shared/Loading'
import EmptyState from './EmptyState'
import { notify } from 'utils/notifications'

const MyBidsModal = ({ isOpen, onClose }: ModalProps) => {
  const { publicKey } = useWallet()
  const [cancelling, setCancelling] = useState('')
  const metaplex = metaplexStore((s) => s.metaplex)
  const { t } = useTranslation(['nft-market'])
  const { data: auctionHouse } = useAuctionHouse()
  const { data: lazyBids, refetch } = useBids()
  const myBids =
    lazyBids && publicKey
      ? lazyBids.filter((x) => x.buyerAddress.equals(publicKey))
      : []

  const { data: bids } = useLoadBids(myBids)

  const cancelBid = async (bid: Bid) => {
    setCancelling(bid.asset.mint.address.toString())
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
      console.log('error cancelling offer', e)
    } finally {
      setCancelling('')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="mb-4 text-center text-lg">Your Offers</h2>
      <div className="space-y-4">
        {bids && bids.length ? (
          bids
            .sort((a, b) => b.createdAt.toNumber() - a.createdAt.toNumber())
            .map((x) => (
              <div
                className="flex items-center justify-between"
                key={x.createdAt.toNumber()}
              >
                <div className="flex items-center">
                  {x.asset?.json?.image ? (
                    <ImgWithLoader
                      className="mr-3 w-12 rounded-md"
                      alt={x.asset?.name || 'Unknown'}
                      src={x.asset.json.image}
                    />
                  ) : null}
                  <div>
                    <p className="font-bold text-th-fgd-2">
                      {x.asset?.json?.name || 'Unknown'}
                    </p>
                    <p className="text-xs">
                      {x.asset?.json?.collection?.family || 'Unknown'}
                    </p>
                    <span className="font-display text-th-fgd-2">
                      {toUiDecimals(x.price.basisPoints, MANGO_MINT_DECIMALS)}{' '}
                      <span className="font-body">MNGO</span>
                    </span>
                  </div>
                </div>
                <NftMarketButton
                  text={
                    cancelling === x.asset.mint.address.toString() ? (
                      <Loading />
                    ) : (
                      t('cancel')
                    )
                  }
                  colorClass="error"
                  onClick={() => cancelBid(x)}
                />
              </div>
            ))
        ) : (
          <EmptyState text="No offers to display..." />
        )}
      </div>
    </Modal>
  )
}

export default MyBidsModal
