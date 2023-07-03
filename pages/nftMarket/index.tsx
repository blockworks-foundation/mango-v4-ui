import useMetaplex from 'hooks/useMetaplex'
import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useState } from 'react'
import SecondaryTabBar from '@components/shared/SecondaryTabBar'
import ListingsView from '@components/nftMarket/ListingsView'
import AllBidsView from '@components/nftMarket/AllBidsView'

const LISTINGS = 'Listings'
const BIDS_WITHOUT_LISTINGS = 'Bids'
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
  useMetaplex()
  const [activeTab, setActiveTab] = useState('Listings')

  return (
    <div className="flex flex-col">
      <div>
        <SecondaryTabBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tabs={TABS}
        />
      </div>
      {activeTab === LISTINGS ? (
        <ListingsView></ListingsView>
      ) : (
        <AllBidsView></AllBidsView>
      )}
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
