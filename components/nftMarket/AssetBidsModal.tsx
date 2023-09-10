import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import {
  useAuctionHouse,
  useBids,
  useLazyListings,
} from 'hooks/market/useAuctionHouse'
import { toUiDecimals } from '@blockworks-foundation/mango-v4'
import { MANGO_MINT_DECIMALS } from 'utils/governance/constants'
import metaplexStore from '@store/metaplexStore'
import { LazyBid, Listing, PublicBid } from '@metaplex-foundation/js'
import { useTranslation } from 'next-i18next'
import EmptyState from './EmptyState'
import dayjs from 'dayjs'
import NftMarketButton from './NftMarketButton'
import Loading from '@components/shared/Loading'
import { useState } from 'react'
import { notify } from 'utils/notifications'

const AssetBidsModal = ({
  isOpen,
  onClose,
  listing,
}: ModalProps & { listing: Listing }) => {
  const { t } = useTranslation(['nft-market'])
  const [accepting, setAccepting] = useState('')
  const metaplex = metaplexStore((s) => s.metaplex)
  const { data: auctionHouse } = useAuctionHouse()
  const { data: lazyBids, refetch: reftechBids } = useBids()
  const { refetch: refetchLazyListings } = useLazyListings()
  const assetBids = lazyBids?.filter((x) =>
    x.metadataAddress.equals(listing.asset.metadataAddress),
  )

  const acceptBid = async (lazyBid: LazyBid) => {
    setAccepting(lazyBid.metadataAddress.toString())
    try {
      const bid = await metaplex!.auctionHouse().loadBid({
        lazyBid,
        loadJsonMetadata: true,
      })

      const { response } = await metaplex!.auctionHouse().sell({
        auctionHouse: auctionHouse!,
        bid: bid as PublicBid,
        sellerToken: listing.asset.token,
      })
      refetchLazyListings()
      reftechBids()
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

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="thin-scroll flex max-h-[500px] flex-col overflow-auto">
        <h2 className="mb-4 text-center text-lg">Offers</h2>
        <div className="space-y-4">
          {assetBids && assetBids.length ? (
            assetBids.map((x) => (
              <div
                className="flex items-center justify-between"
                key={x.createdAt.toNumber()}
              >
                <div>
                  <p className="text-xs">
                    {dayjs(x.createdAt.toNumber() * 1000).format(
                      'DD MMM YY h:mma',
                    )}
                  </p>
                  <span className="font-display text-th-fgd-2">
                    {toUiDecimals(x.price.basisPoints, MANGO_MINT_DECIMALS)}{' '}
                    MNGO
                  </span>
                </div>
                <NftMarketButton
                  text={
                    accepting === x.metadataAddress.toString() ? (
                      <Loading />
                    ) : (
                      t('accept')
                    )
                  }
                  colorClass="error"
                  onClick={() => acceptBid(x)}
                />
              </div>
            ))
          ) : (
            <EmptyState text="No offers to display..." />
          )}
        </div>
      </div>
    </Modal>
  )
}

export default AssetBidsModal
