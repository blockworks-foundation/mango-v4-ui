import { Serum3Market, PerpMarket } from '@blockworks-foundation/mango-v4'
import useJupiterMints from 'hooks/useJupiterMints'
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid'
import Image from 'next/legacy/image'
import { useMemo } from 'react'
import useMangoGroup from 'hooks/useMangoGroup'
import LogoWithFallback from '@components/shared/LogoWithFallback'

const MarketLogos = ({
  market,
  size = 'medium',
}: {
  market: Serum3Market | PerpMarket
  size?: 'small' | 'medium' | 'large'
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
        mangoTokens.find(
          (t) => t.symbol.toUpperCase() === market.name.split('-')[0]
        ) ||
        mangoTokens.find((t) =>
          t.symbol.toUpperCase()?.includes(market.name.split('-')[0])
        )
    }
    const baseLogoURI = jupiterBaseToken ? jupiterBaseToken.logoURI : ''
    const quoteLogoURI = jupiterQuoteToken ? jupiterQuoteToken.logoURI : ''
    return {
      baseLogoURI,
      quoteLogoURI,
      name: market.name.split(/-|\//)[0],
    }
  }, [group, mangoTokens, market])

  const pxSize = size === 'small' ? '16' : size === 'large' ? '24' : '20'

  return (
    <div
      className={`relative ${
        size === 'small'
          ? 'mr-1.5 h-4'
          : size === 'large'
          ? 'mr-2 h-6'
          : 'mr-2 h-5'
      } ${
        market instanceof Serum3Market
          ? size === 'small'
            ? 'w-[27px]'
            : size === 'large'
            ? 'w-[40px]'
            : 'w-[34px]'
          : size === 'small'
          ? 'w-[16px]'
          : size === 'large'
          ? 'w-[24px]'
          : 'w-[20px]'
      }`}
    >
      <div className="absolute left-0 top-0 z-10">
        <LogoWithFallback
          alt=""
          className="flex-shrink-0 drop-shadow-md"
          width={pxSize}
          height={pxSize}
          src={logos.baseLogoURI || `/icons/${logos?.name?.toLowerCase()}.svg`}
          fallback={<FallbackIcon size={size} />}
        />
      </div>
      <div className="absolute right-0 top-0">
        {logos.quoteLogoURI && market instanceof Serum3Market ? (
          <Image
            alt=""
            className="flex-shrink-0 opacity-60"
            width={pxSize}
            height={pxSize}
            src={logos.quoteLogoURI}
          />
        ) : market instanceof PerpMarket ? null : (
          <FallbackIcon size={size} />
        )}
      </div>
    </div>
  )
}

export default MarketLogos

const FallbackIcon = ({ size }: { size: 'small' | 'medium' | 'large' }) => {
  return (
    <QuestionMarkCircleIcon
      className={`${
        size === 'small' ? 'h-4 w-4' : size === 'large' ? 'h-6 w-6' : 'h-5 w-5'
      } flex-shrink-0 text-th-fgd-3`}
    />
  )
}
