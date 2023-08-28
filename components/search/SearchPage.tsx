import ButtonGroup from '@components/forms/ButtonGroup'
import Input from '@components/forms/Input'
import Label from '@components/forms/Label'
import Button from '@components/shared/Button'
import SheenLoader from '@components/shared/SheenLoader'
import {
  ChevronRightIcon,
  MagnifyingGlassIcon,
  NoSymbolIcon,
  UserIcon,
} from '@heroicons/react/20/solid'
import { PublicKey } from '@solana/web3.js'
import { useHiddenMangoAccounts } from 'hooks/useHiddenMangoAccounts'
import { useTranslation } from 'next-i18next'
import { ChangeEvent, useState } from 'react'
import { MANGO_DATA_API_URL } from 'utils/constants'
import { abbreviateAddress } from 'utils/formatting'
import { notify } from 'utils/notifications'

const SEARCH_TYPES = [
  'mango-account',
  'mango-account-name',
  'profile-name',
  'wallet-pk',
  'open-orders-pk',
]

const SearchPage = () => {
  const { t } = useTranslation('search')
  const [loading, setLoading] = useState(false)
  const [searchString, setSearchString] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchType, setSearchType] = useState('mango-account')
  const [showNoResults, setShowNoResults] = useState(false)
  const [isAccountSearch, setIsAccountSearch] = useState(true)
  const { hiddenAccounts } = useHiddenMangoAccounts()

  const handleSearch = async () => {
    if (
      searchType === 'mango-account' ||
      searchType === 'mango-account-name' ||
      searchType === 'open-orders-pk'
    ) {
      setIsAccountSearch(true)
    } else {
      setIsAccountSearch(false)
    }
    try {
      setLoading(true)
      const response = await fetch(
        `${MANGO_DATA_API_URL}/user-data/profile-search?search-string=${searchString}&search-method=${searchType}`,
      )
      let data = await response.json()
      if (isAccountSearch && hiddenAccounts) {
        data = data.filter(
          (d: MangoAccountItem) => !hiddenAccounts.includes(d.mango_account_pk),
        )
      } else if (hiddenAccounts) {
        data = data
          .map((d: WalletItem) => {
            const visibleMangoAccounts = d.mango_accounts.filter(
              (m) => !hiddenAccounts.includes(m.mango_account_pk),
            )
            return {
              owner: d.owner,
              profile_name: d.profile_name,
              mango_accounts: visibleMangoAccounts,
            }
          })
          .filter((d: WalletItem) => d.mango_accounts.length > 0)
      }
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

  return (
    <div className="grid grid-cols-12 p-8 pb-20 md:pb-16 lg:p-10">
      <div className="col-span-12 lg:col-span-8 lg:col-start-3">
        <h1 className="mb-4">{t('search-accounts')}</h1>
        <div className="mb-4">
          <Label text={t('search-by')} />
          <ButtonGroup
            activeValue={searchType}
            onChange={(t) => setSearchType(t)}
            names={SEARCH_TYPES.map((val) => t(val))}
            values={SEARCH_TYPES}
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
        <div className="space-y-2 pt-8">
          {searchResults?.length || showNoResults ? (
            <h2 className="mb-4 border-t border-th-bkg-3 pt-4 text-base">
              {t('results')}
            </h2>
          ) : (
            ''
          )}
          {loading ? (
            <>
              <SheenLoader className="flex flex-1">
                <div className="h-20 w-full rounded-md bg-th-bkg-2" />
              </SheenLoader>
              <SheenLoader className="flex flex-1">
                <div className="h-20 w-full rounded-md bg-th-bkg-2" />
              </SheenLoader>
            </>
          ) : searchResults?.length ? (
            searchResults.map((r) =>
              isAccountSearch ? (
                <MangoAccountItem item={r} type={searchType} />
              ) : (
                <WalletItem item={r} />
              ),
            )
          ) : showNoResults ? (
            <div className="flex flex-col items-center rounded-md border border-th-bkg-3 p-4">
              <NoSymbolIcon className="mb-1 h-6 w-6 text-th-fgd-3" />
              <p className="mb-0.5 text-base font-bold text-th-fgd-2">
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
  type: string
}) => {
  const { mango_account_name, mango_account_pk, profile_name } = item
  return (
    <a
      className="flex items-center justify-between rounded-md border border-th-bkg-3 p-4 md:hover:border-th-bkg-4"
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
  const { mango_accounts, profile_name } = item
  return (
    <>
      {mango_accounts.length
        ? mango_accounts.map((a) => (
            <a
              className="flex items-center justify-between rounded-md border border-th-bkg-3 p-4 md:hover:border-th-bkg-4"
              href={`/?address=${a.mango_account_pk}`}
              rel="noopener noreferrer"
              target="_blank"
              key={a.mango_account_pk}
            >
              <div className="">
                <p className="mb-1 text-base font-bold text-th-fgd-2">
                  {a.mango_account_name}
                </p>
                <div className="flex items-center space-x-1.5">
                  <UserIcon className="h-4 w-4 text-th-fgd-3" />
                  <p className="capitalize">{profile_name}</p>
                </div>
              </div>
              <ChevronRightIcon className="h-6 w-6 text-th-fgd-3" />
            </a>
          ))
        : null}
    </>
  )
}

export default SearchPage
