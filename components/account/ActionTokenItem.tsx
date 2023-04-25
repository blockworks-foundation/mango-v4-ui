import { Bank } from '@blockworks-foundation/mango-v4'
import Image from 'next/legacy/image'
import { useMemo } from 'react'
import useJupiterMints from 'hooks/useJupiterMints'
import FormatNumericValue from '@components/shared/FormatNumericValue'

const ActionTokenItem = ({
  bank,
  customValue,
  onSelect,
  roundUp,
  showBorrowRates,
  showDepositRates,
}: {
  bank: Bank
  customValue: number
  onSelect: (x: string) => void
  roundUp?: boolean
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
      className="flex w-full items-center rounded-md border border-th-bkg-4 bg-th-bkg-1 px-4 py-3 focus-visible:border-th-fgd-4 disabled:cursor-not-allowed disabled:opacity-30 md:hover:border-th-fgd-4 md:disabled:hover:border-th-bkg-4"
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
            <FormatNumericValue value={bank.getDepositRateUi()} decimals={2} />%
          </p>
        </div>
      ) : null}
      {showBorrowRates ? (
        <div className="w-1/4 text-right font-mono">
          <p className="text-th-down">
            <FormatNumericValue value={bank.getBorrowRateUi()} decimals={2} />%
          </p>
        </div>
      ) : null}
      <div className="w-1/2 pl-3 text-right">
        <p className="truncate font-mono text-th-fgd-1">
          <FormatNumericValue
            value={customValue}
            decimals={bank.mintDecimals}
            roundUp={roundUp}
          />
        </p>
      </div>
    </button>
  )
}

export default ActionTokenItem
