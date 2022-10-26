import { Serum3Market, PerpMarket } from '@blockworks-foundation/mango-v4'
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid'
import mangoStore from '@store/mangoStore'
import Image from "next/legacy/image";
import { useMemo } from 'react'

const MarketLogos = ({ market }: { market: Serum3Market | PerpMarket }) => {
  const group = mangoStore((s) => s.group)
  const jupiterTokens = mangoStore((s) => s.jupiterTokens)

  const logos = useMemo(() => {
    if (!group || !jupiterTokens.length || !market)
      return { baseLogoURI: '', quoteLogoURI: '' }

    let jupiterBaseToken, jupiterQuoteToken
    if (market instanceof Serum3Market) {
      const baseBank = group.getFirstBankByTokenIndex(market.baseTokenIndex)
      const quoteBank = group.getFirstBankByTokenIndex(market.quoteTokenIndex)

      jupiterBaseToken = jupiterTokens.find(
        (t) => t.address === baseBank.mint.toString()
      )
      jupiterQuoteToken = jupiterTokens.find(
        (t) => t.address === quoteBank.mint.toString()
      )
    } else {
      jupiterBaseToken = jupiterTokens.find(
        (t) => t.symbol === market.name.split('-')[0]
      )
    }
    const baseLogoURI = jupiterBaseToken ? jupiterBaseToken.logoURI : ''
    const quoteLogoURI = jupiterQuoteToken ? jupiterQuoteToken.logoURI : ''
    return {
      baseLogoURI,
      quoteLogoURI,
    }
  }, [group, jupiterTokens, market])

  return (
    <div
      className={`relative mr-1.5 h-5 ${
        market instanceof Serum3Market ? 'w-[34px]' : 'w-[20px]'
      }`}
    >
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
        {logos.quoteLogoURI && market instanceof Serum3Market ? (
          <Image
            alt=""
            className="rounded-full opacity-60"
            width="20"
            height="20"
            src={logos.quoteLogoURI}
          />
        ) : market instanceof PerpMarket ? null : (
          <QuestionMarkCircleIcon className="h-5 w-5 text-th-fgd-3" />
        )}
      </div>
    </div>
  )
}

export default MarketLogos
