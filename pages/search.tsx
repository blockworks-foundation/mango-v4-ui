import ButtonGroup from '@components/forms/ButtonGroup'
import Input from '@components/forms/Input'
import Label from '@components/forms/Label'
import Button from '@components/shared/Button'
import {
  ChevronRightIcon,
  MagnifyingGlassIcon,
  UserIcon,
} from '@heroicons/react/20/solid'
import { PublicKey } from '@solana/web3.js'
import type { NextPage } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { ChangeEvent, useState } from 'react'
import { abbreviateAddress } from 'utils/formatting'
import { notify } from 'utils/notifications'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  }
}

const Search: NextPage = () => {
  const { t } = useTranslation('search')
  const [loading, setLoading] = useState(false)
  const [searchString, setSearchString] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchType, setSearchType] = useState('mango-account')
  const [showNoResults, setShowNoResults] = useState(false)

  const handleSearch = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `https://mango-transaction-log.herokuapp.com/v4/user-data/profile-search?search-string=${searchString}&search-method=${searchType}`
      )
      const data = await response.json()
      setSearchResults(data)
      if (!data.length) {
        setShowNoResults(true)
      }
    } catch {
      notify({
        title: t('search-failed'),
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const isAccountSearch =
    searchType === 'mango-account' || searchType === 'mango-account-name'

  return (
    <div className="grid grid-cols-12 p-8 pb-20 md:pb-16 lg:p-10">
      <div className="col-span-12 lg:col-span-8 lg:col-start-3">
        <h1 className="mb-4">{t('search-accounts')}</h1>
        <div className="mb-4">
          <Label text={t('search-by')} />
          <ButtonGroup
            activeValue={searchType}
            onChange={(t) => setSearchType(t)}
            values={[
              'mango-account',
              'mango-account-name',
              'profile-name',
              'wallet-pk',
            ]}
          />
        </div>
        <Label text={t('search-for')} />
        <div className="flex space-x-2">
          <Input
            type="text"
            name="search"
            id="search"
            value={searchString}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setSearchString(e.target.value)
            }
          />
          <Button
            className="flex items-center"
            onClick={() => handleSearch()}
            disabled={!searchString}
            size="large"
          >
            <MagnifyingGlassIcon className="mr-2 h-5 w-5" />
            {t('search')}
          </Button>
        </div>
        <div className="space-y-2 py-6">
          {searchResults.length || showNoResults ? (
            <h2 className="text-base">
              {t('results')}{' '}
              <span className="font-mono text-sm font-normal text-th-fgd-4">
                ({searchResults.length})
              </span>
            </h2>
          ) : (
            ''
          )}
          {loading ? (
            'Loading...'
          ) : searchResults.length ? (
            searchResults.map((r) =>
              isAccountSearch ? (
                <MangoAccountItem item={r} type={searchType} />
              ) : (
                <WalletItem item={r} />
              )
            )
          ) : showNoResults ? (
            <div className="flex flex-col items-center rounded-md border border-th-bkg-3 p-4">
              <p className="mb-1 text-base font-bold text-th-fgd-2">
                {t('no-results')}
              </p>
              <p>{t('no-results-desc')}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

interface MangoAccountItem {
  mango_account_name: string
  mango_account_pk: string
  wallet_pk: string
  profile_name: string
}

const MangoAccountItem = ({
  item,
  type,
}: {
  item: MangoAccountItem
  type: 'mango-account' | 'mango-account-name'
}) => {
  const { mango_account_name, mango_account_pk, profile_name } = item
  return (
    <a
      className="default-transition flex items-center justify-between rounded-md border border-th-bkg-3 p-4 md:hover:border-th-bkg-4"
      href={`/?address=${mango_account_pk}`}
      rel="noopener noreferrer"
      target="_blank"
    >
      <div className="">
        <p className="mb-1 text-base font-bold text-th-fgd-2">
          {type === 'mango-account'
            ? abbreviateAddress(new PublicKey(mango_account_pk))
            : mango_account_name}
        </p>
        <div className="flex items-center space-x-1.5">
          <UserIcon className="h-4 w-4 text-th-fgd-3" />
          <p className="capitalize">{profile_name}</p>
        </div>
      </div>
      <ChevronRightIcon className="h-6 w-6 text-th-fgd-3" />
    </a>
  )
}

interface WalletItem {
  mango_accounts: { mango_account_name: string; mango_account_pk: string }[]
  owner: string
  profile_name: string
}

const WalletItem = ({ item }: { item: WalletItem }) => {
  const { mango_accounts, owner, profile_name } = item
  return (
    <div className="rounded-md border border-th-bkg-3 p-4">
      <div className="">
        <p>{profile_name}</p>
        <p>{owner}</p>
      </div>
      {mango_accounts.length
        ? mango_accounts.map((a) => (
            <div key={a.mango_account_pk}>
              <p>{a.mango_account_name}</p>
              <p>{a.mango_account_pk}</p>
            </div>
          ))
        : 'No Mango Accounts'}
    </div>
  )
}

export default Search
