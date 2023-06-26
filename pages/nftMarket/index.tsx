import { toUiDecimals } from '@blockworks-foundation/mango-v4'
import Select from '@components/forms/Select'
import BidNftModal from '@components/nftMarket/BidNftModal'
import AssetBidsModal from '@components/nftMarket/AssetBidsModal'
import MyBidsModal from '@components/nftMarket/MyBidsModal'
import SellNftModal from '@components/nftMarket/SellNftModal'
import Button from '@components/shared/Button'
import { Listing } from '@metaplex-foundation/js'
import { useWallet } from '@solana/wallet-adapter-react'
import metaplexStore from '@store/metaplexStore'
import {
  ALL_FILTER,
  useAuctionHouse,
  useBids,
  useLazyListings,
  useListings,
} from 'hooks/market/useAuctionHouse'
import useMetaplex from 'hooks/useMetaplex'
import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useState } from 'react'
import { MANGO_MINT_DECIMALS } from 'utils/governance/constants'
import { useTranslation } from 'next-i18next'

const filter = [ALL_FILTER, 'My Listings']

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'common',
        'notifications',
        'onboarding',
        'profile',
        'search',
        'settings',
        'token',
        'trade',
      ])),
    },
  }
}

const Market: NextPage = () => {
  useMetaplex()
  const wallet = useWallet()
  const metaplex = metaplexStore((s) => s.metaplex)
  const { t } = useTranslation(['nftMarket'])
  const { data: auctionHouse } = useAuctionHouse()
  const [currentFilter, setCurrentFilter] = useState(ALL_FILTER)
  const { refetch } = useLazyListings()
  const { data: listings } = useListings(currentFilter)
  const { data: bids } = useBids()

  const [bidListing, setBidListing] = useState<null | Listing>(null)
  const [assetBidsListing, setAssetBidsListing] = useState<null | Listing>(null)

  const [sellNftModal, setSellNftModal] = useState(false)
  const [myBidsModal, setMyBidsModal] = useState(false)
  const [asssetBidsModal, setAssetBidsModal] = useState(false)
  const [bidNftModal, setBidNftModal] = useState(false)

  const cancelListing = async (listing: Listing) => {
    await metaplex!.auctionHouse().cancelListing({
      auctionHouse: auctionHouse!,
      listing: listing,
    })
    refetch()
  }

  const buyAsset = async (listing: Listing) => {
    await metaplex!.auctionHouse().buy({
      auctionHouse: auctionHouse!,
      listing,
    })
    refetch()
  }

  const openBidModal = (listing: Listing) => {
    setBidListing(listing)
    setBidNftModal(true)
  }
  const closeBidModal = () => {
    setBidNftModal(false)
    setBidListing(null)
  }
  const openBidsModal = (listing: Listing) => {
    setAssetBidsModal(true)
    setAssetBidsListing(listing)
  }
  const closeBidsModal = () => {
    setAssetBidsModal(false)
    setAssetBidsListing(null)
  }

  return (
    <div className="flex flex-col">
      <div className="mr-5 flex space-x-4 p-4">
        <Button onClick={() => setSellNftModal(true)}>{t('sell')}</Button>
        <Button onClick={() => setMyBidsModal(true)}>{t('my-bids')}</Button>
        <Select
          value={currentFilter}
          onChange={(filter) => setCurrentFilter(filter)}
          className="w-[150px]"
        >
          {filter.map((filter) => (
            <Select.Option key={filter} value={filter}>
              <div className="flex w-full items-center justify-between">
                {filter}
              </div>
            </Select.Option>
          ))}
        </Select>
        {sellNftModal && (
          <SellNftModal
            isOpen={sellNftModal}
            onClose={() => setSellNftModal(false)}
          ></SellNftModal>
        )}
        {myBidsModal && (
          <MyBidsModal
            isOpen={myBidsModal}
            onClose={() => setMyBidsModal(false)}
          ></MyBidsModal>
        )}
        {asssetBidsModal && assetBidsListing && (
          <AssetBidsModal
            listing={assetBidsListing}
            isOpen={asssetBidsModal}
            onClose={closeBidsModal}
          ></AssetBidsModal>
        )}
      </div>
      <div className="flex p-4">
        {listings?.map((x, idx) => (
          <div className="p-4" key={idx}>
            <img src={x.asset.json?.image}></img>
            <div>
              {t('price')}:
              {toUiDecimals(
                x.price.basisPoints.toNumber(),
                MANGO_MINT_DECIMALS
              )}
              {' MNGO'}
            </div>
            <div className="space-x-4">
              {wallet.publicKey && !x.sellerAddress.equals(wallet.publicKey) && (
                <>
                  <Button onClick={() => buyAsset(x)}>{t('buy')}</Button>
                  <Button onClick={() => openBidModal(x)}>{t('bid')}</Button>
                  {bidNftModal && bidListing && (
                    <BidNftModal
                      listing={bidListing}
                      isOpen={bidNftModal}
                      onClose={closeBidModal}
                    ></BidNftModal>
                  )}
                </>
              )}
              {wallet.publicKey && x.sellerAddress.equals(wallet.publicKey) && (
                <>
                  <Button onClick={() => cancelListing(x)}>
                    {t('cancel-listing')}
                  </Button>
                  <Button onClick={() => openBidsModal(x)}>
                    {t('bids')} (
                    {
                      bids?.filter((bid) =>
                        bid.metadataAddress.equals(x.asset.metadataAddress)
                      ).length
                    }
                    )
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

export default Market

//TODO move to governance
//   const feeAccount = Keypair.generate()
//   const treasuryAccount = Keypair.generate()
//   const auctionMint = new PublicKey(
//     'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr'
//   )
//   const treasuryWalletWithAuctionMint = new PublicKey(
//     '6TSTn1diScs6wWHFoazfqLZmkToZ7ZgHFf3M3yj2UH4Y'
//   )
//   const createAuctionHouse = async () => {
//     const auctionHouseSettingsObj = {
//       treasuryMint: auctionMint,
//       sellerFeeBasisPoints: 160,
//       auctioneerAuthority: wallet.publicKey!,
//       auctionHouseFeeAccount: feeAccount,
//       auctionHouseTreasury: treasuryAccount,
//       feeWithdrawalDestination: treasuryWalletWithAuctionMint,
//       treasuryWithdrawalDestination: treasuryWalletWithAuctionMint,
//       requireSignOff: false,
//       canChangeSalePrice: false,
//     }
//     await metaplex!.auctionHouse().create({
//       ...auctionHouseSettingsObj,
//     })
//   }
