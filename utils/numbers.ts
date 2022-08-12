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

export const floorToDecimal = (value: number, decimals: number) => {
  return Math.floor(value * 10 ** decimals) / 10 ** decimals
}

const numberFormatter0 = Intl.NumberFormat('en', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
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
  } else if (value >= 1000) {
    return numberFormatter0.format(value)
  } else if (value >= 1) {
    return numberFormatter2.format(value)
  } else {
    return numberFormatter4.format(value)
  }
}
