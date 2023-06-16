import { useWallet } from '@solana/wallet-adapter-react'
import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import { useEffect, useState } from 'react'
import mangoStore from '@store/mangoStore'
import { useTranslation } from 'next-i18next'
import { ImgWithLoader } from '@components/ImgWithLoader'
import { NFT } from 'types'
import Input from '@components/forms/Input'
import Label from '@components/forms/Label'
import Button from '@components/shared/Button'
import { MANGO_MINT_DECIMALS } from 'utils/governance/constants'
import { PublicKey } from '@solana/web3.js'
import { token } from '@metaplex-foundation/js'
import metaplexStore from '@store/metaplexStore'
import { useAuctionHouse, useLazyListings } from 'hooks/market/useAuctionHouse'

const SellNftModal = ({ isOpen, onClose }: ModalProps) => {
  const { publicKey } = useWallet()
  const { t } = useTranslation()
  const metaplex = metaplexStore((s) => s.metaplex)
  const { data: auctionHouse } = useAuctionHouse()
  const { refetch } = useLazyListings()
  const connection = mangoStore((s) => s.connection)
  const nfts = mangoStore((s) => s.wallet.nfts.data)
  const isLoadingNfts = mangoStore((s) => s.wallet.nfts.loading)
  const fetchNfts = mangoStore((s) => s.actions.fetchNfts)

  const [minPrice, setMinPrice] = useState('')
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null)

  useEffect(() => {
    if (publicKey) {
      fetchNfts(connection, publicKey)
    }
  }, [publicKey])

  const listAsset = async (mint: string, price: number) => {
    const currentListings = await metaplex?.auctionHouse().findListings({
      auctionHouse: auctionHouse!,
      seller: publicKey!,
      mint: new PublicKey(mint),
    })
    const isCurrentlyListed = currentListings?.filter(
      (x) => !x.canceledAt
    ).length
    if (isCurrentlyListed) {
      throw 'Item is currently listed by you'
    }
    await metaplex!.auctionHouse().list({
      auctionHouse: auctionHouse!, // A model of the Auction House related to this listing
      mintAccount: new PublicKey(mint), // The mint account to create a listing for, used to find the metadata
      price: token(price, MANGO_MINT_DECIMALS), // The listing price
    })
    refetch()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex min-h-[264px] flex-col">
        {nfts.length > 0 ? (
          <div className="flex flex-col items-center">
            <div className="mb-4 grid max-h-[500px] w-full grid-flow-row grid-cols-4 gap-4 overflow-auto">
              {nfts.map((n) => (
                <button
                  className={`col-span-1 flex items-center justify-center rounded-md border bg-th-bkg-2 py-3 sm:py-4 md:hover:bg-th-bkg-3 ${
                    selectedNft?.address === n.address
                      ? 'border-th-active'
                      : 'border-th-bkg-3'
                  }`}
                  key={n.address}
                  onClick={() => setSelectedNft(n)}
                >
                  <ImgWithLoader
                    alt={n.name}
                    className="h-16 w-16 flex-shrink-0 rounded-full sm:h-20 sm:w-20"
                    src={n.image}
                  />
                </button>
              ))}
            </div>
          </div>
        ) : isLoadingNfts ? (
          <div className="mb-4 grid w-full grid-flow-row grid-cols-3 gap-4">
            {[...Array(9)].map((x, i) => (
              <div
                className="col-span-1 h-[90px] animate-pulse rounded-md bg-th-bkg-3 sm:h-28"
                key={i}
              />
            ))}
          </div>
        ) : (
          <div className="flex h-60 items-center justify-center">
            <p>{t('profile:no-nfts')}</p>
          </div>
        )}
        <div className="flex flex-col">
          <Label text="Min MNGO price - If someone bids this price, the item will be immediately sold at that price."></Label>
          <Input
            className="mb-2"
            type="number"
            value={minPrice}
            onChange={(e) => {
              setMinPrice(e.target.value)
            }}
          ></Input>
          <Button
            disabled={!selectedNft || !minPrice}
            onClick={() => listAsset(selectedNft!.mint, Number(minPrice))}
          >
            List
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default SellNftModal
