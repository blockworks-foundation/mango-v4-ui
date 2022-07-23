import mangoStore from '../../store/state'
import DepositTokenItem from './DepositTokenItem'

const DepositTokenList = ({ onSelect }: { onSelect: (x: any) => void }) => {
  const group = mangoStore((s) => s.group)
  const banks = group?.banksMap
    ? Array.from(group?.banksMap, ([key, value]) => ({ key, value }))
    : []
  return (
    <>
      <div className="grid grid-cols-3 px-4 pb-2">
        <div className="col-span-1">
          <p className="text-xs">Token</p>
        </div>
        <div className="col-span-1 flex justify-end">
          <p className="text-xs">Deposit Rate (APR)</p>
        </div>
        <div className="col-span-1 flex justify-end">
          <p className="text-xs">Collateral Weight</p>
        </div>
      </div>
      <div className="space-y-2">
        {banks.map((bank) => (
          <DepositTokenItem
            bank={bank.value}
            key={bank.value.name}
            onSelect={onSelect}
          />
        ))}
      </div>
    </>
  )
}

export default DepositTokenList
