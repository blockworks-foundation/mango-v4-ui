import ButtonGroup from '@components/forms/ButtonGroup'
import Input from '@components/forms/Input'
import Button from '@components/shared/Button'
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import type { NextPage } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { ChangeEvent, FormEvent, useState } from 'react'
import { notify } from 'utils/notifications'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  }
}

const Search: NextPage = () => {
  const { t } = useTranslation('common')
  const [loading, setLoading] = useState(false)
  const [searchString, setSearchString] = useState('')
  //   const [searchResults, setSearchResults] = useState([])
  const [searchType, setSearchType] = useState('mango-account')

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const response = await fetch(
        `https://mango-transaction-log.herokuapp.com/v4/user-data/profile-search?search-string=${searchString}&search-method=${searchType}`
      )
      const data = await response.json()
      console.log(data)
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
    <div className="">
      <form onSubmit={(e) => handleSearch(e)}>
        <Input
          type="text"
          name="search"
          id="search"
          value={searchString}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setSearchString(e.target.value)
          }
          prefix={<MagnifyingGlassIcon className="h-5 w-5" />}
        />
        <ButtonGroup
          activeValue={searchType}
          onChange={(t) => setSearchType(t)}
          values={['mango-account', 'mango-account-name', 'profile-name']}
        />
        <Button disabled={!searchString} type="submit">
          {t('search')}
        </Button>
      </form>
      {loading ? 'Loading...' : ''}
    </div>
  )
}

export default Search
