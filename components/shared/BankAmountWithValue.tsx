import { Bank } from '@blockworks-foundation/mango-v4'
import Decimal from 'decimal.js'
import FormatNumericValue from './FormatNumericValue'

const BankAmountWithValue = ({
  amount = 0,
  bank,
  decimals,
  fixDecimals = true,
  stacked,
  value,
  isPrivate,
}: {
  amount: Decimal | number | string
  bank: Bank
  decimals?: number
  fixDecimals?: boolean
  stacked?: boolean
  value?: number
  isPrivate?: boolean
}) => {
  return (
    <p className={`font-mono text-th-fgd-2 ${stacked ? 'text-right' : ''}`}>
      <>
        <FormatNumericValue
          value={amount}
          decimals={
            decimals
              ? decimals
              : amount && fixDecimals
              ? bank.mintDecimals
              : undefined
          }
        />{' '}
        <span className={`text-th-fgd-4 ${stacked ? 'block' : ''}`}>
          <FormatNumericValue
            value={value ? value : Number(amount) * bank.uiPrice}
            decimals={decimals || fixDecimals ? 2 : undefined}
            isUsd={true}
            isPrivate={isPrivate}
          />
        </span>
      </>
    </p>
  )
}

export default BankAmountWithValue
