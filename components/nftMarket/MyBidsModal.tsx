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
import Button from '@components/shared/Button'
import metaplexStore from '@store/metaplexStore'
import { Bid } from '@metaplex-foundation/js'
import { useTranslation } from 'next-i18next'

const MyBidsModal = ({ isOpen, onClose }: ModalProps) => {
  const { publicKey } = useWallet()
  const metaplex = metaplexStore((s) => s.metaplex)
  const { t } = useTranslation(['nftMarket'])
  const { data: auctionHouse } = useAuctionHouse()
  const { data: lazyBids, refetch } = useBids()
  const myBids =
    lazyBids && publicKey
      ? lazyBids.filter((x) => x.buyerAddress.equals(publicKey))
      : []

  const { data: bids } = useLoadBids(myBids)

  const cancelBid = async (bid: Bid) => {
    await metaplex!.auctionHouse().cancelBid({
      auctionHouse: auctionHouse!,
      bid,
    })
    refetch()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex max-h-[500px] min-h-[264px] flex-col overflow-auto">
        {bids?.map((x) => (
          <p className="flex space-x-2" key={x.createdAt.toNumber()}>
            <ImgWithLoader
              className="w-16"
              alt={x.asset.name}
              src={x.asset.json!.image!}
            ></ImgWithLoader>
            <div>{x.createdAt.toNumber()}</div>
            <div>{toUiDecimals(x.price.basisPoints, MANGO_MINT_DECIMALS)}</div>
            <div>
              <Button onClick={() => cancelBid(x)}>{t('cancel')}</Button>
            </div>
          </p>
        ))}
      </div>
    </Modal>
  )
}

export default MyBidsModal
