import { Bank } from '@blockworks-foundation/mango-v4'
import useMangoAccount from 'hooks/useMangoAccount'
import ActionTokenItem from './ActionTokenItem'

type BankParams = {
  bank: Bank
  balance: number
  borrowedAmount: number
  walletBalance: number
  maxBorrow: number
  maxWithdraw: number
}

const ActionTokenList = ({
  banks,
  onSelect,
  showBorrowRates,
  showDepositRates,
  valueKey,
}: {
  banks: BankParams[]
  onSelect: (x: string) => void
  showBorrowRates?: boolean
  showDepositRates?: boolean
  valueKey:
    | 'balance'
    | 'borrowedAmount'
    | 'maxBorrow'
    | 'maxWithdraw'
    | 'walletBalance'
}) => {
  const { mangoAccount } = useMangoAccount()

  return mangoAccount ? (
    <>
      <div className="space-y-2">
        {banks?.length ? (
          banks
            .filter((b: BankParams) => !!b)
            .map((b) => {
              return (
                <ActionTokenItem
                  bank={b.bank}
                  customValue={b[valueKey]}
                  key={b.bank.name}
                  onSelect={onSelect}
                  roundUp={valueKey === 'borrowedAmount'}
                  showBorrowRates={showBorrowRates}
                  showDepositRates={showDepositRates}
                />
              )
            })
        ) : (
          <div className="mt-4 rounded border border-th-bkg-2 py-3 text-center text-th-fgd-4">
            Nothing to select
          </div>
        )}
      </div>
    </>
  ) : null
}

export default ActionTokenList
