import Input from '@components/forms/Input'
import Button from '@components/shared/Button'
import {
  LazyListing,
  Listing,
  Metaplex,
  token,
  walletAdapterIdentity,
} from '@metaplex-foundation/js'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js'
import mangoStore from '@store/mangoStore'
import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useEffect, useState } from 'react'

const mock_connection = new Connection(clusterApiUrl('devnet'))
const mock_metaplex = new Metaplex(mock_connection)

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
  const connection = mangoStore((s) => s.connection)
  const wallet = useWallet()

  const [metaplex, setMetaplex] = useState(mock_metaplex)
  const [listings, setListings] = useState<Listing[]>([])
  const [mintToList, setMintToList] = useState('')

  const feeAccount = Keypair.generate()
  const treasuryAccount = Keypair.generate()
  const auctionMint = new PublicKey(
    'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr'
  )
  const treasuryWalletWithAuctionMint = new PublicKey(
    '6TSTn1diScs6wWHFoazfqLZmkToZ7ZgHFf3M3yj2UH4Y'
  )

  const auctionHousePk = new PublicKey(
    'FkBFtcHvLh43YsBPRrGE63jd7xJgJFb3kjASfyciV17A'
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
    await metaplex.auctionHouse().create({
      ...auctionHouseSettingsObj,
    })
  }
  const fetchAuctionHouse = async () => {
    const auctionHouse = await metaplex
      .auctionHouse()
      .findByAddress({ address: auctionHousePk })
    const listings = (
      await metaplex.auctionHouse().findListings({
        auctionHouse,
      })
    ).filter((x) => !x.canceledAt) as LazyListing[]
    console.log(listings)
    loadMetadatas(listings)
  }

  const loadMetadatas = async (listings: LazyListing[]) => {
    const loadedListings = []
    for (const listing of listings) {
      const elo = await metaplex.auctionHouse().loadListing({
        lazyListing: {
          ...listing,
        },
        loadJsonMetadata: true,
      })
      loadedListings.push({ ...elo })
    }
    setListings(loadedListings)
  }

  const cancelListing = async (listing: Listing) => {
    const auctionHouse = await metaplex
      .auctionHouse()
      .findByAddress({ address: auctionHousePk })

    await metaplex.auctionHouse().cancelListing({
      auctionHouse, // A model of the Auction House related to this listing
      listing: listing,
    })
    fetchAuctionHouse()
  }

  const listAsset = async () => {
    const auctionHouse = await metaplex
      .auctionHouse()
      .findByAddress({ address: auctionHousePk })

    await metaplex.auctionHouse().list({
      auctionHouse, // A model of the Auction House related to this listing
      mintAccount: new PublicKey(mintToList), // The mint account to create a listing for, used to find the metadata
      price: token(1), // The listing price
    })
    fetchAuctionHouse()
  }

  useEffect(() => {
    let meta = new Metaplex(connection, {
      cluster: 'devnet',
    })
    meta = meta.use(walletAdapterIdentity(wallet))
    setMetaplex(meta)
  }, [connection, wallet])

  useEffect(() => {
    fetchAuctionHouse()
  }, [metaplex])

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
        {listings.map((x, idx) => (
          <div className="p-4" key={idx}>
            <div>
              Amount: {x.price.basisPoints.toString()}{' '}
              {wallet.publicKey && x.sellerAddress.equals(wallet.publicKey) && (
                <Button onClick={() => cancelListing(x)}>Cancel</Button>
              )}
            </div>
            <img src={x.asset.json?.image}></img>
            <div>
              <Button>Bid</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Market
