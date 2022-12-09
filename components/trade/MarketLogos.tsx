import { Serum3Market, PerpMarket } from '@blockworks-foundation/mango-v4'
import useJupiterMints from 'hooks/useJupiterMints'
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid'
import Image from 'next/legacy/image'
import { useMemo } from 'react'
import useMangoGroup from 'hooks/useMangoGroup'
import LogoWithFallback from '@components/shared/LogoWithFallback'

const MarketLogos = ({
  market,
  small,
}: {
  market: Serum3Market | PerpMarket
  small?: boolean
}) => {
  const { group } = useMangoGroup()
  const { mangoTokens } = useJupiterMints()

  const logos = useMemo(() => {
    if (!group || !mangoTokens.length || !market)
      return { baseLogoURI: '', quoteLogoURI: '' }

    let jupiterBaseToken, jupiterQuoteToken
    if (market instanceof Serum3Market) {
      const baseBank = group.getFirstBankByTokenIndex(market.baseTokenIndex)
      const quoteBank = group.getFirstBankByTokenIndex(market.quoteTokenIndex)

      jupiterBaseToken = mangoTokens.find(
        (t) => t.address === baseBank.mint.toString()
      )
      jupiterQuoteToken = mangoTokens.find(
        (t) => t.address === quoteBank.mint.toString()
      )
    } else {
      jupiterBaseToken =
        mangoTokens.find((t) => t.symbol === market.name.split('-')[0]) ||
        mangoTokens.find((t) => t.symbol.includes(market.name.split('-')[0]))
    }
    const baseLogoURI = jupiterBaseToken ? jupiterBaseToken.logoURI : ''
    const quoteLogoURI = jupiterQuoteToken ? jupiterQuoteToken.logoURI : ''
    return {
      baseLogoURI,
      quoteLogoURI,
      name: market.name.split(/-|\//)[0],
    }
  }, [group, mangoTokens, market])

  return (
    <div
      className={`relative mr-1.5 ${small ? 'h-4' : 'h-5'} ${
        market instanceof Serum3Market
          ? small
            ? 'w-[27px]'
            : 'w-[34px]'
          : small
          ? 'w-[16px]'
          : 'w-[20px]'
      }`}
    >
      <div className="absolute left-0 top-0">
        <LogoWithFallback
          alt=""
          className="z-10 drop-shadow-md"
          width={small ? '16' : '20'}
          height={small ? '16' : '20'}
          src={logos.baseLogoURI}
          fallback={<div></div>}
        />
      </div>
      <div className="absolute right-0 top-0">
        {logos.quoteLogoURI && market instanceof Serum3Market ? (
          <Image
            alt=""
            className="opacity-60"
            width={small ? '16' : '20'}
            height={small ? '16' : '20'}
            src={logos.quoteLogoURI}
          />
        ) : market instanceof PerpMarket ? null : (
          <QuestionMarkCircleIcon
            className={`${small ? 'h-4 w-4' : 'h-5 w-5'} text-th-fgd-3`}
          />
        )}
      </div>
    </div>
  )
}

export default MarketLogos
