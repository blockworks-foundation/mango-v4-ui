import { CLUSTER } from '@store/mangoStore'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

export const SANCTIONED_COUNTRIES = [
  ['AG', 'Antigua and Barbuda'],
  ['DZ', 'Algeria'],
  ['BD', 'Bangladesh'],
  ['BO', 'Bolivia'],
  ['BY', 'Belarus'],
  ['BI', 'Burundi'],
  ['MM', 'Burma (Myanmar)'],
  ['CI', "Cote D'Ivoire (Ivory Coast)"],
  ['CU', 'Cuba'],
  ['CD', 'Democratic Republic of Congo'],
  ['EC', 'Ecuador'],
  ['GB', 'United Kingdom'],
  ['IR', 'Iran'],
  ['IQ', 'Iraq'],
  ['LR', 'Liberia'],
  ['LY', 'Libya'],
  ['ML', 'Mali'],
  ['MA', 'Morocco'],
  ['NP', 'Nepal'],
  ['KP', 'North Korea'],
  ['SO', 'Somalia'],
  ['SD', 'Sudan'],
  ['SY', 'Syria'],
  ['VE', 'Venezuela'],
  ['YE', 'Yemen'],
  ['ZW', 'Zimbabwe'],
  ['US', 'United States'],
]

const SANCTIONED_COUNTRY_CODES = SANCTIONED_COUNTRIES.map(
  (country) => country[0],
)

const PERP_ALLOWED: string[] = []
const SPOT_ALLOWED: string[] = []
const SWAP_ALLOWED: string[] = []
const BORROW_LEND_ALLOWED: string[] = []
const SHOW_WARNING: string[] = ['GB']

const fetchIpGeolocation = async () => {
  try {
    const response = await fetch(
      `https://country-code.mangomarkets.workers.dev`,
    )
    const parsedResponse = await response.json()
    const ipCountryCode = parsedResponse ? parsedResponse?.country : ''

    return ipCountryCode
  } catch (e) {
    console.log('failed to fetch ip country', e)
    return ''
  }
}

export default function useIpAddress() {
  const [ipAllowed, setIpAllowed] = useState(true)
  const [spotAllowed, setSpotAllowed] = useState(true)
  const [perpAllowed, setPerpAllowed] = useState(true)
  const [swapAllowed, setSwapAllowed] = useState(true)
  const [borrowLendAllowed, setBorrowLendAllowed] = useState(true)
  const [showWarning, setShowWarning] = useState(false)
  const [ipCountry, setIpCountry] = useState('')

  const { data: ipCountryCode, isInitialLoading } = useQuery<string, Error>(
    ['ip-address'],
    () => fetchIpGeolocation(),
    {
      cacheTime: 1000 * 60 * 2,
      staleTime: 1000 * 60 * 2,
      retry: 3,
      refetchOnWindowFocus: true,
    },
  )

  useEffect(() => {
    if (ipCountryCode) {
      setIpCountry(ipCountryCode)
      setIpAllowed(!SANCTIONED_COUNTRY_CODES.includes(ipCountryCode))
      setSpotAllowed(SPOT_ALLOWED.includes(ipCountryCode))
      setPerpAllowed(PERP_ALLOWED.includes(ipCountryCode))
      setSwapAllowed(SWAP_ALLOWED.includes(ipCountryCode))
      setBorrowLendAllowed(BORROW_LEND_ALLOWED.includes(ipCountryCode))
      setShowWarning(SHOW_WARNING.includes(ipCountryCode))
    }
  }, [ipCountryCode])

  if (CLUSTER === 'mainnet-beta' && !process.env.NEXT_PUBLIC_DISABLE_GEOBLOCK) {
    return {
      ipAllowed,
      spotAllowed,
      perpAllowed,
      swapAllowed,
      borrowLendAllowed,
      showWarning,
      ipCountry,
      loadingIpCountry: isInitialLoading,
    }
  } else {
    return {
      ipAllowed: true,
      spotAllowed: true,
      perpAllowed: true,
      swapAllowed: true,
      borrowLendAllowed: true,
      showWarning: true,
      ipCountry,
      loadingIpCountry: isInitialLoading,
    }
  }
}
