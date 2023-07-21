import { CLUSTER } from '@store/mangoStore'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

const SANCTIONED_COUNTRIES = [
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

const SPOT_ALLOWED = ['GB']

const fetchIpGeolocation = async () => {
  const response = await fetch(`https://country-code.mangomarkets.workers.dev`)
  const parsedResponse = await response.json()
  const ipCountryCode = parsedResponse ? parsedResponse?.country : ''

  return ipCountryCode
}

export default function useIpAddress() {
  const [ipAllowed, setIpAllowed] = useState(false)
  const [spotAllowed, setSpotAllowed] = useState(false)
  const [ipCountry, setIpCountry] = useState('')

  const ipCountryCode = useQuery<string, Error>(
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
    if (ipCountryCode.data) {
      setIpCountry(ipCountryCode.data)
      setIpAllowed(!SANCTIONED_COUNTRY_CODES.includes(ipCountryCode.data))
      setSpotAllowed(SPOT_ALLOWED.includes(ipCountryCode.data))
    }
  }, [ipCountryCode])

  if (CLUSTER === 'mainnet-beta') {
    return { ipAllowed, spotAllowed, ipCountry }
  } else {
    return { ipAllowed: true, spotAllowed: true, ipCountry }
  }
}
