import { Bank } from '@blockworks-foundation/mango-v4'
import Image from 'next/image'
import { formatDecimal } from '../../utils/numbers'

const DepositTokenItem = ({
  bank,
  onSelect,
}: {
  bank: Bank
  onSelect: (x: any) => void
}) => {
  const { name } = bank
  return (
    <button
      className="grid w-full grid-cols-3 rounded-md border border-th-bkg-4 px-4 py-3 md:hover:border-th-fgd-4"
      onClick={() => onSelect(name)}
    >
      <div className="col-span-1 flex items-center">
        <div className="mr-2.5 flex flex-shrink-0 items-center">
          <Image
            alt=""
            width="24"
            height="24"
            src={`/icons/${name.toLowerCase()}.svg`}
          />
        </div>
        <p className="font-bold text-th-fgd-1">{name}</p>
      </div>
      <div className="col-span-1 flex justify-end">
        <p className="text-th-green">
          {formatDecimal(bank.getDepositRate().toNumber(), 2)}%
        </p>
      </div>
      <div className="col-span-1 flex justify-end">
        <p className="text-th-fgd-1">100%</p>
      </div>
    </button>
  )
}

export default DepositTokenItem
