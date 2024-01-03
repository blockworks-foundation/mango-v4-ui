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
import { useIsWhiteListed } from 'hooks/useIsWhiteListed'
import { useTranslation } from 'react-i18next'

const LISTINGS = 'Listings'
const BIDS_WITHOUT_LISTINGS = 'Offers'
const TABS = [LISTINGS, BIDS_WITHOUT_LISTINGS]

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'account',
        'close-account',
        'common',
        'nft-market',
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
  const { t } = useTranslation(['common', 'nft-market'])
  useMetaplex()
  const [activeTab, setActiveTab] = useState(LISTINGS)
  const [sellNftModal, setSellNftModal] = useState(false)
  const [myBidsModal, setMyBidsModal] = useState(false)
  const { data: isWhiteListed } = useIsWhiteListed()

  //TODO leave for release
  //   const create = async () => {
  //     const auctionMint = new PublicKey(
  //       'MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac'
  //     )
  //     const owner = new PublicKey('8SSLjXBEVk9nesbhi9UMCA32uijbVBUqWoKPPQPTekzt')

  //     const auctionHouseSettingsObj = {
  //       treasuryMint: auctionMint,
  //       sellerFeeBasisPoints: 0,
  //       authority: owner,
  //       feeWithdrawalDestination: owner,
  //       treasuryWithdrawalDestinationOwner: owner,
  //       requireSignOff: false,
  //       canChangeSalePrice: false,
  //     }
  //     const elo = await metaplex!.auctionHouse().create({
  //       ...auctionHouseSettingsObj,
  //     })
  //     console.log(elo)
  //   }

  return isWhiteListed ? (
    <>
      <div className="mx-auto flex max-w-[1140px] flex-col px-6 pb-16">
        <div className="flex items-center justify-between pb-6 pt-8">
          <h1>{t('nft-market')}</h1>
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
  ) : null
}

export default Market
