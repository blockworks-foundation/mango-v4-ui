import { Bank } from '@blockworks-foundation/mango-v4'
import Image from 'next/image'
import { useMemo } from 'react'
import mangoStore from '../../store/state'
import { floorToDecimal, formatDecimal } from '../../utils/numbers'
import { walletBalanceForToken } from '../modals/DepositModal'

const DepositTokenItem = ({
  bank,
  onSelect,
}: {
  bank: Bank
  onSelect: (x: any) => void
}) => {
  const { mint, name } = bank
  const walletTokens = mangoStore((s) => s.wallet.tokens)
  const jupiterTokens = mangoStore((s) => s.jupiterTokens)

  const tokenMax = useMemo(() => {
    return walletBalanceForToken(walletTokens, name)
  }, [name, walletTokens])

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
      className="flex w-full rounded-md border border-th-bkg-4 px-4 py-3 md:hover:border-th-fgd-4"
      onClick={() => onSelect(name)}
    >
      <div className="flex w-1/4 items-center">
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
      <div className="w-1/4 text-right">
        <p className="text-th-green">
          {formatDecimal(bank.getDepositRate().toNumber(), 2)}%
        </p>
      </div>
      <div className="w-2/4 text-right">
        <p className="text-th-fgd-1">
          {floorToDecimal(tokenMax.maxAmount, tokenMax.maxDecimals)}
        </p>
      </div>
    </button>
  )
}

export default DepositTokenItem
