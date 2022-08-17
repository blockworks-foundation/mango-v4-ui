import { Bank } from '@blockworks-foundation/mango-v4'
import Image from 'next/image'
import { useMemo } from 'react'
import mangoStore from '../../store/state'
import { formatDecimal } from '../../utils/numbers'

const DepositTokenItem = ({
  bank,
  onSelect,
  walletBalance,
}: {
  bank: Bank
  onSelect: (x: any) => void
  walletBalance: number
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
      disabled={walletBalance === 0}
      onClick={() => onSelect(name)}
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
      <div className="w-2/5 text-right">
        <p className="text-th-green">
          {formatDecimal(bank.getDepositRate().toNumber(), 2)}%
        </p>
      </div>
      <div className="w-2/5 text-right">
        <p className="text-th-fgd-1">{walletBalance}</p>
      </div>
    </button>
  )
}

export default DepositTokenItem
