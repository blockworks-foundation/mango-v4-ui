import { CURRENCIES } from '@components/settings/DisplaySettings'
import mangoStore from '@store/mangoStore'
import { useMemo } from 'react'
import { SAVED_CURRENCY_KEY } from 'utils/constants'
import { notify } from 'utils/notifications'
import useLocalStorageState from './useLocalStorageState'

export default function useCurrencyConversion() {
  const currencyData = mangoStore((s) => s.currencies.data)
  const [savedCurrency, setSavedCurrency] = useLocalStorageState(
    SAVED_CURRENCY_KEY,
    CURRENCIES[0]
  )

  const convertedPrice: number = useMemo(() => {
    if (savedCurrency.currency === 'USD' || !currencyData.length) return 1
    const savedCurrencyData = currencyData.find((c) => {
      const parsedSavedCurrency = JSON.parse(savedCurrency)
      return c.symbol === parsedSavedCurrency.id
    })
    // when api returns undefined for currency price
    if (savedCurrencyData && !savedCurrencyData.price) {
      setSavedCurrency(JSON.stringify(CURRENCIES[0]))
      notify({
        title: `${savedCurrency.currency} conversion is not currently available. Values are set to USD`,
        type: 'error',
      })
    }

    return savedCurrencyData?.price ? savedCurrencyData.price : 1
  }, [savedCurrency, currencyData.length])

  return convertedPrice || 1
}
