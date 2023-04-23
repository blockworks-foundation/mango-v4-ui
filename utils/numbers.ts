import Decimal from 'decimal.js'

export const formatNumericValue = (
  value: number | string | Decimal,
  decimals?: number,
  roundUp?: boolean
): string => {
  const numberValue = Number(value)
  let formattedValue
  if (numberValue > -0.0000000001 && numberValue < 0.000000001) {
    formattedValue = '0'
  } else if (decimals) {
    formattedValue = roundUp
      ? roundValue(numberValue, decimals, true)
      : roundValue(numberValue, decimals)
  } else if (Math.abs(numberValue) >= 1000) {
    formattedValue = roundUp
      ? roundValue(numberValue, 0, true)
      : roundValue(numberValue, 0)
  } else if (Math.abs(numberValue) >= 0.1) {
    formattedValue = roundUp
      ? roundValue(numberValue, 3, true)
      : roundValue(numberValue, 3)
  } else {
    formattedValue = roundUp
      ? roundValue(numberValue, 9, true)
      : roundValue(numberValue, 9)
  }
  return formattedValue
}

export const formatCurrencyValue = (
  value: number | string | Decimal,
  decimals?: number
): string => {
  const numberValue = Number(value)
  let formattedValue
  if (numberValue > -0.0000000001 && numberValue < 0.000000001) {
    formattedValue = '$0.00'
  } else if (decimals) {
    formattedValue = Intl.NumberFormat('en', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      style: 'currency',
      currency: 'USD',
    }).format(numberValue)
  } else if (Math.abs(numberValue) >= 1000) {
    formattedValue = usdFormatter0.format(numberValue)
  } else if (Math.abs(numberValue) >= 0.1) {
    formattedValue = usdFormatter2.format(numberValue)
  } else {
    formattedValue = usdFormatter3Sig.format(numberValue)
  }

  if (formattedValue === '-$0.00') return '$0.00'
  return formattedValue
}

const roundValue = (
  value: number | string | Decimal,
  decimals: number,
  roundUp?: boolean
): string => {
  const decimalValue = value instanceof Decimal ? value : new Decimal(value)
  const roundMode = roundUp ? Decimal.ROUND_UP : Decimal.ROUND_FLOOR
  const roundedValue = decimalValue
    .toDecimalPlaces(decimals, roundMode)
    .toNumber()
  if (decimals === 2) return digits2.format(roundedValue)
  if (decimals === 3) return digits3.format(roundedValue)
  if (decimals === 4) return digits4.format(roundedValue)
  if (decimals === 5) return digits5.format(roundedValue)
  if (decimals === 6) return digits6.format(roundedValue)
  if (decimals === 7) return digits7.format(roundedValue)
  if (decimals === 8) return digits8.format(roundedValue)
  if (decimals === 9) return digits9.format(roundedValue)
  return roundedValue.toLocaleString(undefined, {
    maximumFractionDigits: decimals,
  })
}

const digits2 = new Intl.NumberFormat('en', { maximumFractionDigits: 2 })
const digits3 = new Intl.NumberFormat('en', { maximumFractionDigits: 3 })
const digits4 = new Intl.NumberFormat('en', { maximumFractionDigits: 4 })
const digits5 = new Intl.NumberFormat('en', { maximumFractionDigits: 5 })
const digits6 = new Intl.NumberFormat('en', { maximumFractionDigits: 6 })
const digits7 = new Intl.NumberFormat('en', { maximumFractionDigits: 7 })
const digits8 = new Intl.NumberFormat('en', { maximumFractionDigits: 8 })
const digits9 = new Intl.NumberFormat('en', { maximumFractionDigits: 9 })

export const numberFormat = new Intl.NumberFormat('en', {
  maximumSignificantDigits: 7,
})

export const floorToDecimal = (
  value: number | string | Decimal,
  decimals: number
): Decimal => {
  const decimal = value instanceof Decimal ? value : new Decimal(value)

  return decimal.toDecimalPlaces(decimals, Decimal.ROUND_FLOOR)
}

const usdFormatter0 = Intl.NumberFormat('en', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
  style: 'currency',
  currency: 'USD',
})

const usdFormatter2 = Intl.NumberFormat('en', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  style: 'currency',
  currency: 'USD',
})

const usdFormatter3Sig = Intl.NumberFormat('en', {
  minimumSignificantDigits: 3,
  maximumSignificantDigits: 3,
  style: 'currency',
  currency: 'USD',
})

export const countLeadingZeros = (x: number) => {
  if (x % 1 == 0) {
    return 0
  } else {
    return -1 - Math.floor(Math.log10(x % 1))
  }
}

export const getDecimalCount = (value: number): number => {
  if (
    !isNaN(value) &&
    Math.floor(value) !== value &&
    value.toString().includes('.')
  )
    return value.toString().split('.')[1].length || 0
  if (
    !isNaN(value) &&
    Math.floor(value) !== value &&
    value.toString().includes('e')
  )
    return parseInt(value.toString().split('e-')[1] || '0')
  return 0
}

export const numberCompacter = Intl.NumberFormat('en', {
  maximumFractionDigits: 2,
  notation: 'compact',
})
