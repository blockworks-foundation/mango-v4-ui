import { Bank } from '@blockworks-foundation/mango-v4'
import mangoStore from '@store/mangoStore'
import ActionTokenItem from './ActionTokenItem'

type BankParams = {
  key: string
  value: Bank[]
  walletBalance?: number
  maxAmount?: number
  accountBalance?: number
}

const ActionTokenList = ({
  banks,
  onSelect,
  sortByKey,
  showBorrowRates,
  showDepositRates,
  valueKey,
}: {
  banks: BankParams[]
  onSelect: (x: string) => void
  sortByKey:
    | 'maxAmount'
    | 'walletBalanceValue'
    | 'accountBalanceValue'
    | 'borrowAmountValue'
  showBorrowRates?: boolean
  showDepositRates?: boolean
  valueKey: 'maxAmount' | 'walletBalance' | 'accountBalance' | 'borrowAmount'
}) => {
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)

  return mangoAccount ? (
    <>
      <div className="space-y-2">
        {banks?.length ? (
          banks
            .filter((b: BankParams) => !!b)
            .sort((a: any, b: any) => b[sortByKey] - a[sortByKey])
            .map((bank: any) => (
              <ActionTokenItem
                bank={bank.value[0]}
                customValue={bank[valueKey]}
                key={bank.value[0].name}
                onSelect={onSelect}
                showBorrowRates={showBorrowRates}
                showDepositRates={showDepositRates}
              />
            ))
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
