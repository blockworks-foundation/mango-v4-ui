import mangoStore from '../../store/state'
import ActionTokenItem from './ActionTokenItem'

const ActionTokenList = ({
  banks,
  onSelect,
  sortByKey,
  showBorrowRates,
  showDepositRates,
}: {
  banks: any
  onSelect: (x: string) => void
  sortByKey: string
  showBorrowRates?: boolean
  showDepositRates?: boolean
}) => {
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)

  return mangoAccount ? (
    <>
      <div className="space-y-2">
        {banks
          .sort((a: any, b: any) => b[sortByKey] - a[sortByKey])
          .map((bank: any) => (
            <ActionTokenItem
              bank={bank.value}
              customValue={bank[sortByKey]}
              key={bank.value.name}
              onSelect={onSelect}
              showBorrowRates={showBorrowRates}
              showDepositRates={showDepositRates}
            />
          ))}
      </div>
    </>
  ) : null
}

export default ActionTokenList
