import { Bank } from '@blockworks-foundation/mango-v4'
import mangoStore from '../../store/mangoStore'
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
}: {
  banks: BankParams[]
  onSelect: (x: string) => void
  sortByKey: 'maxAmount' | 'walletBalance' | 'accountBalance'
  showBorrowRates?: boolean
  showDepositRates?: boolean
}) => {
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)

  return mangoAccount ? (
    <>
      <div className="space-y-2">
        {banks?.length
          ? banks
              .filter((b: BankParams) => !!b)
              .sort((a: any, b: any) => b[sortByKey] - a[sortByKey])
              .map((bank: any) => (
                <ActionTokenItem
                  bank={bank.value[0]}
                  customValue={bank[sortByKey]}
                  key={bank.value[0].name}
                  onSelect={onSelect}
                  showBorrowRates={showBorrowRates}
                  showDepositRates={showDepositRates}
                />
              ))
          : null}
      </div>
    </>
  ) : null
}

export default ActionTokenList
