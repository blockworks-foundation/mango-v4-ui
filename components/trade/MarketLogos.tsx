import { Serum3Market } from '@blockworks-foundation/mango-v4'
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid'
import mangoStore from '@store/mangoStore'
import Image from 'next/image'
import { useMemo } from 'react'

const MarketLogos = ({ serumMarket }: { serumMarket: Serum3Market }) => {
  const group = mangoStore((s) => s.group)
  const jupiterTokens = mangoStore((s) => s.jupiterTokens)

  const logos = useMemo(() => {
    if (!group || !jupiterTokens.length || !serumMarket)
      return { baseLogoURI: '', quoteLogoURI: '' }
    const baseBank = group.getFirstBankByTokenIndex(serumMarket.baseTokenIndex)
    const quoteBank = group.getFirstBankByTokenIndex(
      serumMarket.quoteTokenIndex
    )
    const jupiterBaseToken = jupiterTokens.find(
      (t) => t.address === baseBank.mint.toString()
    )
    const jupiterQuoteToken = jupiterTokens.find(
      (t) => t.address === quoteBank.mint.toString()
    )
    const baseLogoURI = jupiterBaseToken ? jupiterBaseToken.logoURI : ''
    const quoteLogoURI = jupiterQuoteToken ? jupiterQuoteToken.logoURI : ''
    return {
      baseLogoURI,
      quoteLogoURI,
    }
  }, [group, jupiterTokens, serumMarket])
  return (
    <div className="relative mr-1.5 h-5 w-[34px]">
      <div className="absolute left-0 top-0">
        {logos.baseLogoURI ? (
          <Image
            alt=""
            className="z-10 rounded-full drop-shadow-md"
            width="20"
            height="20"
            src={logos.baseLogoURI}
          />
        ) : (
          <QuestionMarkCircleIcon className="h-5 w-5 text-th-fgd-3" />
        )}
      </div>
      <div className="absolute right-0 top-0">
        {logos.quoteLogoURI ? (
          <Image
            alt=""
            className="rounded-full opacity-60"
            width="20"
            height="20"
            src={logos.quoteLogoURI}
          />
        ) : (
          <QuestionMarkCircleIcon className="h-5 w-5 text-th-fgd-3" />
        )}
      </div>
    </div>
  )
}

export default MarketLogos
