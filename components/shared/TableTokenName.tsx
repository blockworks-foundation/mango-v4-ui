import { Bank } from '@blockworks-foundation/mango-v4'
import TokenLogo from './TokenLogo'
import TokenReduceOnlyDesc from './TokenReduceOnlyDesc'

const TableTokenName = ({ bank, symbol }: { bank: Bank; symbol: string }) => {
  return (
    <div className="flex items-center">
      <div className="mr-2.5 flex flex-shrink-0 items-center">
        <TokenLogo bank={bank} />
      </div>
      <div>
        <p className="font-body leading-none text-th-fgd-2">{symbol}</p>
        <TokenReduceOnlyDesc bank={bank} />
      </div>
    </div>
  )
}

export default TableTokenName
