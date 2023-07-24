import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import { useState, useCallback } from 'react'
import Input from '@components/forms/Input'
import Label from '@components/forms/Label'
import Button, { LinkButton } from '@components/shared/Button'
import { MANGO_MINT_DECIMALS } from 'utils/governance/constants'
import { Listing, PublicKey, token } from '@metaplex-foundation/js'
import metaplexStore from '@store/metaplexStore'
import { useAuctionHouse, useBids } from 'hooks/market/useAuctionHouse'
import { ImgWithLoader } from '@components/ImgWithLoader'
// import { useTranslation } from 'next-i18next'
import { toUiDecimals } from '@blockworks-foundation/mango-v4'

type ListingModalProps = {
  listing?: Listing
} & ModalProps

const BidNftModal = ({ isOpen, onClose, listing }: ListingModalProps) => {
  const metaplex = metaplexStore((s) => s.metaplex)
  const { data: auctionHouse } = useAuctionHouse()
  const { refetch } = useBids()
  // const { t } = useTranslation(['nft-market'])
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
      <h2 className="mb-4 text-center text-lg">Make an Offer</h2>
      <div className="flex flex-col items-center">
        {listing ? (
          <div className="flex flex-col items-center">
            <ImgWithLoader
              alt={listing.asset.name}
              className="mb-3 h-40 w-40 flex-shrink-0 rounded-md"
              src={listing.asset.json!.image!}
            />
            <LinkButton>
              <span className="font-body font-normal">
                Buy Now:{' '}
                <span className="font-display">
                  {toUiDecimals(
                    listing.price.basisPoints.toNumber(),
                    MANGO_MINT_DECIMALS,
                  )}{' '}
                  <span className="font-bold">MNGO</span>
                </span>
              </span>
            </LinkButton>
          </div>
        ) : (
          <>
            <Label text="NFT Mint" />
            <Input
              className="mb-2"
              type="text"
              value={assetMint}
              onChange={(e) => {
                setAssetMint(e.target.value)
              }}
            />
          </>
        )}
        <div className="mt-4 flex w-full items-end">
          <div className="w-full">
            <Label text="Offer Price"></Label>
            <Input
              value={bidPrice}
              onChange={(e) => {
                setBidPrice(e.target.value)
              }}
              suffix="MNGO"
            />
          </div>
          <Button
            className="ml-2 whitespace-nowrap"
            onClick={bid}
            disabled={!bidPrice}
            size="large"
          >
            Make Offer
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default BidNftModal
