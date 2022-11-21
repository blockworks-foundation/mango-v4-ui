import Decimal from 'decimal.js'

const digits2 = new Intl.NumberFormat('en', { maximumFractionDigits: 2 })
const digits6 = new Intl.NumberFormat('en', { maximumFractionDigits: 6 })
const digits8 = new Intl.NumberFormat('en', { maximumFractionDigits: 8 })
const digits9 = new Intl.NumberFormat('en', { maximumFractionDigits: 9 })

export const formatDecimal = (
  value: number,
  decimals = 6,
  opts = { fixed: false }
): string => {
  if (opts?.fixed) return value.toFixed(decimals)

  if (value > -0.0000001 && value < 0.0000001) return '0.00'

  if (decimals === 2) return digits2.format(value)
  if (decimals === 6) return digits6.format(value)
  if (decimals === 8) return digits8.format(value)
  if (decimals === 9) return digits9.format(value)
  return value.toString()
}

export const numberFormat = new Intl.NumberFormat('en', {
  maximumSignificantDigits: 7,
})

export const floorToDecimal = (
  value: number | string | Decimal,
  decimals: number
): Decimal => {
  const decimal = value instanceof Decimal ? value : new Decimal(value)

  return decimal.toDecimalPlaces(decimals, Decimal.ROUND_DOWN)
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

const usdFormatter4 = Intl.NumberFormat('en', {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
  style: 'currency',
  currency: 'USD',
})

export const formatFixedDecimals = (
  value: number,
  isCurrency?: boolean,
  isPercentage?: boolean
): string => {
  let formattedValue
  if (value === 0) {
    formattedValue = isCurrency ? '$0.00' : '0'
  } else if (isPercentage) {
    formattedValue = Number(floorToDecimal(value, 2)).toLocaleString(
      undefined,
      {
        maximumFractionDigits: 2,
      }
    )
  } else if (Math.abs(value) >= 1000) {
    formattedValue = isCurrency
      ? usdFormatter0.format(value)
      : Number(floorToDecimal(value, 0)).toLocaleString(undefined, {
          maximumFractionDigits: 0,
        })
  } else if (Math.abs(value) >= 0.1) {
    formattedValue = isCurrency
      ? usdFormatter2.format(value)
      : Number(floorToDecimal(value, 3)).toLocaleString(undefined, {
          maximumFractionDigits: 3,
        })
  } else {
    formattedValue = isCurrency
      ? usdFormatter4.format(value)
      : Number(floorToDecimal(value, 4)).toLocaleString(undefined, {
          maximumFractionDigits: 4,
        })
  }

  if (formattedValue === '-$0.00') return '$0.00'
  return formattedValue
}

export const countLeadingZeros = (x: number) => {
  if (x % 1 == 0) {
    return 0
  } else {
    return -1 - Math.floor(Math.log10(x % 1))
  }
}

export const trimDecimals = (n: number, digits: number) => {
  const step = Math.pow(10, digits || 0)
  const temp = Math.trunc(step * n)

  return temp / step
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
