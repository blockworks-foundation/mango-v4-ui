import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import {
  useAuctionHouse,
  useBids,
  useLazyListings,
} from 'hooks/market/useAuctionHouse'
import { toUiDecimals } from '@blockworks-foundation/mango-v4'
import { MANGO_MINT_DECIMALS } from 'utils/governance/constants'
import Button from '@components/shared/Button'
import metaplexStore from '@store/metaplexStore'
import { LazyBid, Listing, PublicBid } from '@metaplex-foundation/js'
import { useTranslation } from 'next-i18next'

const AssetBidsModal = ({
  isOpen,
  onClose,
  listing,
}: ModalProps & { listing: Listing }) => {
  const { t } = useTranslation(['nft-market'])
  const metaplex = metaplexStore((s) => s.metaplex)
  const { data: auctionHouse } = useAuctionHouse()
  const { data: lazyBids, refetch: reftechBids } = useBids()
  const { refetch: refetchLazyListings } = useLazyListings()
  const assetBids = lazyBids?.filter((x) =>
    x.metadataAddress.equals(listing.asset.metadataAddress),
  )

  const acceptBid = async (lazyBid: LazyBid) => {
    const bid = await metaplex!.auctionHouse().loadBid({
      lazyBid,
      loadJsonMetadata: true,
    })

    await metaplex!.auctionHouse().sell({
      auctionHouse: auctionHouse!,
      bid: bid as PublicBid,
      sellerToken: listing.asset.token,
    })
    refetchLazyListings()
    reftechBids()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex max-h-[500px] min-h-[264px] flex-col overflow-auto">
        {assetBids?.map((x) => (
          <p className="flex space-x-2" key={x.createdAt.toNumber()}>
            <div>{x.createdAt.toNumber()}</div>
            <div>{toUiDecimals(x.price.basisPoints, MANGO_MINT_DECIMALS)}</div>
            <div>
              <Button onClick={() => acceptBid(x)}>{t('accept-bid')}</Button>
            </div>
          </p>
        ))}
      </div>
    </Modal>
  )
}

export default AssetBidsModal
