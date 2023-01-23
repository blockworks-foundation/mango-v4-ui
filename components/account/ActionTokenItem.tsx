import { Bank } from '@blockworks-foundation/mango-v4'
import Image from 'next/legacy/image'
import { useMemo } from 'react'
import {
  formatDecimal,
  formatFixedDecimals,
  trimDecimals,
} from '../../utils/numbers'
import useJupiterMints from 'hooks/useJupiterMints'

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
  const { mangoTokens } = useJupiterMints()

  const logoUri = useMemo(() => {
    let logoURI
    if (mangoTokens?.length) {
      logoURI = mangoTokens.find((t) => t.address === mint.toString())?.logoURI
    }
    return logoURI
  }, [mint, mangoTokens])

  return (
    <button
      className="default-transition flex w-full items-center rounded-md border border-th-bkg-4 bg-th-bkg-1 px-4 py-3 disabled:cursor-not-allowed disabled:opacity-30 md:hover:border-th-fgd-4 md:disabled:hover:border-th-bkg-4"
      onClick={() => onSelect(name)}
      disabled={customValue <= 0}
    >
      <div
        className={`flex ${
          !showBorrowRates && !showDepositRates ? 'w-1/2' : 'w-1/4'
        } items-center`}
      >
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
        <div className="w-1/4 text-right font-mono">
          <p className="text-th-up">
            {formatDecimal(bank.getDepositRate().toNumber(), 2)}%
          </p>
        </div>
      ) : null}
      {showBorrowRates ? (
        <div className="w-1/4 text-right font-mono">
          <p className="text-th-down">
            {formatDecimal(bank.getBorrowRate().toNumber(), 2)}%
          </p>
        </div>
      ) : null}
      <div className="w-1/2 pl-3 text-right">
        <p className="truncate font-mono text-th-fgd-1">
          {formatFixedDecimals(
            trimDecimals(customValue, bank.mintDecimals + 1)
          )}
        </p>
      </div>
    </button>
  )
}

export default ActionTokenItem
