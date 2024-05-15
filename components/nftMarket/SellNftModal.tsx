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
import Loading from '@components/shared/Loading'
import { notify } from 'utils/notifications'

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
  const [submitting, setSubmitting] = useState(false)
  const [minPrice, setMinPrice] = useState('')
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null)

  useEffect(() => {
    if (publicKey) {
      fetchNfts(connection, publicKey)
    }
  }, [publicKey])

  const listAsset = async (mint: string, price: number) => {
    setSubmitting(true)
    try {
      const currentListings = await metaplex?.auctionHouse().findListings({
        auctionHouse: auctionHouse!,
        seller: publicKey!,
        mint: new PublicKey(mint),
      })
      const isCurrentlyListed = currentListings?.filter((x) => !x.canceledAt)
        .length
      if (isCurrentlyListed) {
        throw 'Item is currently listed by you'
      }
      const { response } = await metaplex!.auctionHouse().list({
        auctionHouse: auctionHouse!, // A model of the Auction House related to this listing
        mintAccount: new PublicKey(mint), // The mint account to create a listing for, used to find the metadata
        price: token(price, MANGO_MINT_DECIMALS), // The listing price
      })
      refetch()
      if (response) {
        notify({
          title: 'Transaction confirmed',
          type: 'success',
          txid: response.signature,
        })
      }
      onClose()
    } catch (e) {
      console.log('error listing nft', e)
      notify({
        title: `${e}`,
        type: 'error',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="hide-scroll h-[320px] overflow-y-auto">
        {nfts.length > 0 ? (
          <div className="flex flex-col items-center">
            <div className="grid grid-flow-row auto-rows-max grid-cols-4 gap-1">
              {nfts.map((n) => (
                <button
                  className={`flex h-24 w-24 items-center justify-center rounded-md border bg-th-bkg-2 py-3 sm:py-4 md:hover:bg-th-bkg-3 ${
                    selectedNft?.address === n.address
                      ? 'border-th-active'
                      : 'border-th-bkg-3'
                  }`}
                  key={n.address}
                  onClick={() => setSelectedNft(n)}
                >
                  <ImgWithLoader
                    alt={n.name}
                    className="h-16 w-16 shrink-0 rounded-full"
                    src={n.image}
                  />
                </button>
              ))}
            </div>
          </div>
        ) : isLoadingNfts ? (
          <div className="grid grid-flow-row auto-rows-max grid-cols-4 gap-1">
            {[...Array(12)].map((x, i) => (
              <div
                className="h-24 w-24 animate-pulse rounded-md bg-th-bkg-3"
                key={i}
              />
            ))}
          </div>
        ) : (
          <div className="flex h-60 items-center justify-center">
            <p>{t('profile:no-nfts')}</p>
          </div>
        )}
      </div>
      <div className="flex items-end pt-6">
        <div className="w-full">
          <Label text="Buy Now Price"></Label>
          <Input
            value={minPrice}
            onChange={(e) => {
              setMinPrice(e.target.value)
            }}
            suffix="MNGO"
          ></Input>
        </div>
        <Button
          className="ml-2 flex items-center justify-center"
          disabled={!selectedNft || !minPrice}
          onClick={() => listAsset(selectedNft!.mint, Number(minPrice))}
          size="large"
        >
          {submitting ? <Loading /> : 'List'}
        </Button>
      </div>
    </Modal>
  )
}

export default SellNftModal
