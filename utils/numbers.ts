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
