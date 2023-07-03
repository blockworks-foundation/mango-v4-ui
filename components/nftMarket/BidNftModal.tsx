import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import { useState, useCallback } from 'react'
import Input from '@components/forms/Input'
import Label from '@components/forms/Label'
import Button from '@components/shared/Button'
import { MANGO_MINT_DECIMALS } from 'utils/governance/constants'
import { Listing, PublicKey, token } from '@metaplex-foundation/js'
import metaplexStore from '@store/metaplexStore'
import { useAuctionHouse, useBids } from 'hooks/market/useAuctionHouse'
import { ImgWithLoader } from '@components/ImgWithLoader'
import { useTranslation } from 'next-i18next'

type ListingModalProps = {
  listing?: Listing
} & ModalProps

const BidNftModal = ({ isOpen, onClose, listing }: ListingModalProps) => {
  const metaplex = metaplexStore((s) => s.metaplex)
  const { data: auctionHouse } = useAuctionHouse()
  const { refetch } = useBids()
  const { t } = useTranslation(['nftMarket'])
  const noneListedAssetMode = !listing

  const [bidPrice, setBidPrice] = useState('')
  const [assetMint, setAssetMint] = useState('')

  const bid = useCallback(async () => {
    await metaplex!.auctionHouse().bid({
      auctionHouse: auctionHouse!,
      price: token(bidPrice, MANGO_MINT_DECIMALS),
      mintAccount: noneListedAssetMode
        ? new PublicKey(assetMint)
        : listing!.asset.mint.address,
    })
    onClose()
    refetch()
  }, [
    metaplex,
    auctionHouse,
    bidPrice,
    noneListedAssetMode,
    assetMint,
    listing,
    onClose,
    refetch,
  ])

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center">
        {listing ? (
          <ImgWithLoader
            alt={listing.asset.name}
            className="h-32 w-32 flex-shrink-0 rounded-full sm:h-20 sm:w-20"
            src={listing.asset.json!.image!}
          />
        ) : (
          <>
            <Label text="Nft mint"></Label>
            <Input
              className="mb-2"
              type="text"
              value={assetMint}
              onChange={(e) => {
                setAssetMint(e.target.value)
              }}
            ></Input>
          </>
        )}
        <Label text="Bid price"></Label>
        <Input
          className="mb-2"
          type="number"
          value={bidPrice}
          onChange={(e) => {
            setBidPrice(e.target.value)
          }}
        ></Input>
        <Button onClick={bid} disabled={!bidPrice}>
          {t('bid')}
        </Button>
      </div>
    </Modal>
  )
}

export default BidNftModal
