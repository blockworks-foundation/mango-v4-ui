import { toUiDecimals } from '@blockworks-foundation/mango-v4'
import Input from '@components/forms/Input'
import Button from '@components/shared/Button'
import { Listing, token } from '@metaplex-foundation/js'
import { useWallet } from '@solana/wallet-adapter-react'
import { Keypair, PublicKey } from '@solana/web3.js'
import metaplexStore from '@store/metaplexStore'
import { useAuctionHouse, useListings } from 'hooks/market/useAuctionHouse'
import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useState } from 'react'
import { MANGO_MINT_DECIMALS } from 'utils/governance/constants'

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
  const wallet = useWallet()
  const metaplex = metaplexStore((s) => s.metaplex)
  const { data: auctionHouse } = useAuctionHouse()
  const { data: listings } = useListings()
  const [mintToList, setMintToList] = useState('')

  const feeAccount = Keypair.generate()
  const treasuryAccount = Keypair.generate()
  const auctionMint = new PublicKey(
    'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr'
  )
  const treasuryWalletWithAuctionMint = new PublicKey(
    '6TSTn1diScs6wWHFoazfqLZmkToZ7ZgHFf3M3yj2UH4Y'
  )

  const createAuctionHouse = async () => {
    const auctionHouseSettingsObj = {
      treasuryMint: auctionMint,
      sellerFeeBasisPoints: 160,
      auctioneerAuthority: wallet.publicKey!,
      auctionHouseFeeAccount: feeAccount,
      auctionHouseTreasury: treasuryAccount,
      feeWithdrawalDestination: treasuryWalletWithAuctionMint,
      treasuryWithdrawalDestination: treasuryWalletWithAuctionMint,
      requireSignOff: false,
      canChangeSalePrice: false,
    }
    await metaplex!.auctionHouse().create({
      ...auctionHouseSettingsObj,
    })
  }

  const cancelListing = async (listing: Listing) => {
    await metaplex!.auctionHouse().cancelListing({
      auctionHouse: auctionHouse!, // A model of the Auction House related to this listing
      listing: listing,
    })
  }

  const listAsset = async () => {
    await metaplex!.auctionHouse().list({
      auctionHouse: auctionHouse!, // A model of the Auction House related to this listing
      mintAccount: new PublicKey(mintToList), // The mint account to create a listing for, used to find the metadata
      price: token(2, 6), // The listing price
    })
  }

  const bidOnAsset = async (listing: Listing) => {
    await metaplex!.auctionHouse().buy({
      auctionHouse: auctionHouse!,
      listing,
    })
  }

  return (
    <div className="flex">
      <div className="mr-5">
        Mint to list
        <Input
          type="text"
          onChange={(e) => setMintToList(e.target.value)}
          value={mintToList}
        ></Input>
        <button onClick={listAsset}>List</button>
      </div>
      <div>
        <button onClick={createAuctionHouse}>create</button>
      </div>
      <div className="flex p-4">
        {listings?.map((x, idx) => (
          <div className="p-4" key={idx}>
            <div>
              Price:
              {toUiDecimals(
                x.price.basisPoints.toNumber(),
                MANGO_MINT_DECIMALS
              )}
              {' USDC'}
              {wallet.publicKey && x.sellerAddress.equals(wallet.publicKey) && (
                <Button onClick={() => cancelListing(x)}>Cancel</Button>
              )}
            </div>
            <img src={x.asset.json?.image}></img>
            <div>
              <Button onClick={() => bidOnAsset(x)}>Buy</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Market
