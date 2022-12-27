import { CLUSTER } from '@store/mangoStore'
import { useCallback, useEffect, useState } from 'react'

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
  (country) => country[0]
)

const SPOT_ALLOWED = ['GB']

export default function useIpAddress() {
  const [ipAllowed, setIpAllowed] = useState(false)
  const [spotAllowed, setSpotAllowed] = useState(false)
  const [ipCountry, setIpCountry] = useState('')

  const checkIpLocation = useCallback(async () => {
    const response = await fetch(
      `https://country-code.mangomarkets.workers.dev`
    )
    const parsedResponse = await response.json()
    const ipCountryCode = parsedResponse ? parsedResponse?.country : ''

    setIpCountry(ipCountryCode)

    if (ipCountryCode) {
      setIpAllowed(!SANCTIONED_COUNTRY_CODES.includes(ipCountryCode))
      setSpotAllowed(SPOT_ALLOWED.includes(ipCountryCode))
    }
  }, [])

  useEffect(() => {
    checkIpLocation()
  }, [checkIpLocation])

  if (CLUSTER === 'mainnet-beta') {
    return { ipAllowed, spotAllowed, ipCountry }
  } else {
    return { ipAllowed: true, spotAllowed: true, ipCountry }
  }
}
