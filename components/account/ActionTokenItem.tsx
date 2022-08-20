import { Bank } from '@blockworks-foundation/mango-v4'
import Image from 'next/image'
import { useMemo } from 'react'
import mangoStore from '../../store/mangoStore'
import { formatDecimal } from '../../utils/numbers'

const ActionTokenItem = ({
  bank,
  customValue,
  onSelect,
  showBorrowRates,
  showDepositRates,
}: {
  bank: Bank
  customValue: number
  onSelect: (x: string) => void
  showBorrowRates?: boolean
  showDepositRates?: boolean
}) => {
  const { mint, name } = bank
  const jupiterTokens = mangoStore((s) => s.jupiterTokens)

  const logoUri = useMemo(() => {
    let logoURI
    if (jupiterTokens.length) {
      logoURI = jupiterTokens.find(
        (t) => t.address === mint.toString()
      )!.logoURI
    }
    return logoURI
  }, [mint, jupiterTokens])

  return (
    <button
      className="default-transition flex w-full rounded-md border border-th-bkg-4 px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60 md:hover:border-th-fgd-4 md:disabled:hover:border-th-bkg-4"
      onClick={() => onSelect(name)}
      disabled={customValue <= 0}
    >
      <div className="flex w-1/5 items-center">
        <div className="mr-2.5 flex flex-shrink-0 items-center">
          <Image
            alt=""
            width="24"
            height="24"
            src={logoUri || `/icons/${name.toLowerCase()}.svg`}
          />
        </div>
        <p className="text-th-fgd-1">{name}</p>
      </div>
      {showDepositRates ? (
        <div className="w-2/5 text-right">
          <p className="text-th-green">
            {formatDecimal(bank.getDepositRate().toNumber(), 2)}%
          </p>
        </div>
      ) : null}
      {showBorrowRates ? (
        <div className="w-2/5 text-right">
          <p className="text-th-red">
            {formatDecimal(bank.getBorrowRate().toNumber(), 2)}%
          </p>
        </div>
      ) : null}
      <div className="w-2/5 text-right">
        <p className="text-th-fgd-1">{formatDecimal(customValue)}</p>
      </div>
    </button>
  )
}

export default ActionTokenItem
