import useMetaplex from 'hooks/useMetaplex'
import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useState } from 'react'
import ListingsView from '@components/nftMarket/ListingsView'
import AllBidsView from '@components/nftMarket/AllBidsView'
import Button from '@components/shared/Button'
// import { useTranslation } from 'next-i18next'
import TabUnderline from '@components/shared/TabUnderline'
import SellNftModal from '@components/nftMarket/SellNftModal'
import MyBidsModal from '@components/nftMarket/MyBidsModal'

const LISTINGS = 'Listings'
const BIDS_WITHOUT_LISTINGS = 'Offers'
const TABS = [LISTINGS, BIDS_WITHOUT_LISTINGS]

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
        'nftMarket',
      ])),
    },
  }
}

const Market: NextPage = () => {
  // const { t } = useTranslation('nftMarket')
  useMetaplex()
  const [activeTab, setActiveTab] = useState('Listings')
  const [sellNftModal, setSellNftModal] = useState(false)
  const [myBidsModal, setMyBidsModal] = useState(false)

  return (
    <>
      <div className="mx-auto flex max-w-[1140px] flex-col px-6">
        <div className="flex items-center justify-between pt-8 pb-6">
          <h1>NFT Market</h1>
          <div className="flex space-x-2">
            <Button onClick={() => setSellNftModal(true)}>
              Sell your NFTs
            </Button>
            <Button onClick={() => setMyBidsModal(true)} secondary>
              Your Offers
            </Button>
          </div>
        </div>
        <div>
          <TabUnderline
            activeValue={activeTab}
            values={TABS}
            onChange={(v) => setActiveTab(v)}
            fillWidth={false}
          />
        </div>
        <div className="">
          {activeTab === LISTINGS ? <ListingsView /> : <AllBidsView />}
        </div>
      </div>
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
    </>
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
