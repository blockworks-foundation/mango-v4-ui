const digits2 = new Intl.NumberFormat('en', { maximumFractionDigits: 2 })
const digits6 = new Intl.NumberFormat('en', { maximumFractionDigits: 6 })
const digits9 = new Intl.NumberFormat('en', { maximumFractionDigits: 9 })

export const formatDecimal = (
  value: number,
  decimals: number = 6,
  opts = { fixed: false }
) => {
  if (opts?.fixed) return value.toFixed(decimals)

  if (decimals === 2) return digits2.format(value)
  if (decimals === 6) return digits6.format(value)
  if (decimals === 9) return digits9.format(value)
}

export const numberFormat = new Intl.NumberFormat('en', {
  maximumSignificantDigits: 7,
})

const numberFormatter2 = Intl.NumberFormat('en', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const numberFormatter4 = Intl.NumberFormat('en', {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
})

const numberFormatter6 = Intl.NumberFormat('en', {
  minimumFractionDigits: 6,
  maximumFractionDigits: 6,
})

export const formatFixedDecimals = (value: number) => {
  if (value === 0) {
    return 0
  } else if (value >= 100) {
    return numberFormatter2.format(value)
  } else if (value >= 1) {
    return numberFormatter4.format(value)
  } else {
    return numberFormatter6.format(value)
  }
}
