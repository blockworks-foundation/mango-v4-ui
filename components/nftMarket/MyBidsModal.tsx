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
import dayjs from 'dayjs'
import NftMarketButton from './NftMarketButton'

const MyBidsModal = ({ isOpen, onClose }: ModalProps) => {
  const { publicKey } = useWallet()
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
    await metaplex!.auctionHouse().cancelBid({
      auctionHouse: auctionHouse!,
      bid,
    })
    refetch()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="mb-4 text-center text-lg">Your Offers</h2>
      <div className="space-y-4">
        {bids?.map((x) => (
          <div
            className="flex items-center justify-between"
            key={x.createdAt.toNumber()}
          >
            <div className="flex items-center">
              <ImgWithLoader
                className="mr-3 w-12 rounded-md"
                alt={x.asset.name}
                src={x.asset.json!.image!}
              />
              <div>
                <p className="text-xs">
                  {dayjs(x.createdAt.toNumber()).format('DD MMM YY h:mma')}
                </p>
                <span className="font-display text-th-fgd-2">
                  {toUiDecimals(x.price.basisPoints, MANGO_MINT_DECIMALS)} MNGO
                </span>
              </div>
            </div>
            <NftMarketButton
              text={t('cancel')}
              colorClass="error"
              onClick={() => cancelBid(x)}
            />
          </div>
        ))}
      </div>
    </Modal>
  )
}

export default MyBidsModal
