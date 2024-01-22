import { Serum3Market, PerpMarket } from '@blockworks-foundation/mango-v4'
import useJupiterMints from 'hooks/useJupiterMints'
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid'
import Image from 'next/legacy/image'
import { useMemo } from 'react'
import useMangoGroup from 'hooks/useMangoGroup'
import LogoWithFallback from '@components/shared/LogoWithFallback'
import { CUSTOM_TOKEN_ICONS } from 'utils/constants'

const MarketLogos = ({
  market,
  size = 'medium',
}: {
  market: Serum3Market | PerpMarket
  size?: 'xs' | 'small' | 'medium' | 'large'
}) => {
  const { group } = useMangoGroup()
  const { mangoTokens } = useJupiterMints()

  const logos = useMemo(() => {
    if (!group || !mangoTokens.length || !market)
      return { baseLogoURI: '', quoteLogoURI: '' }
    let baseLogoURI, quoteLogoURI
    if (market instanceof Serum3Market) {
      const baseBank = group.getFirstBankByTokenIndex(market.baseTokenIndex)
      const quoteBank = group.getFirstBankByTokenIndex(market.quoteTokenIndex)
      const baseSymbol = baseBank.name.toLowerCase()
      const quoteSymbol = quoteBank.name.toLowerCase()

      const hasCustomBaseIcon = CUSTOM_TOKEN_ICONS[baseSymbol]
      const hasCustomQuoteIcon = CUSTOM_TOKEN_ICONS[quoteSymbol]

      const jupiterBaseToken = mangoTokens.find(
        (t) => t.address === baseBank.mint.toString(),
      )
      const jupiterQuoteToken = mangoTokens.find(
        (t) => t.address === quoteBank.mint.toString(),
      )

      baseLogoURI = hasCustomBaseIcon
        ? `/icons/${baseSymbol}.svg`
        : jupiterBaseToken?.logoURI
      quoteLogoURI = hasCustomQuoteIcon
        ? `/icons/${quoteSymbol}.svg`
        : jupiterQuoteToken?.logoURI
    } else {
      const marketName = market.name.split('-')[0].toLowerCase()
      const hasCustomIcon = CUSTOM_TOKEN_ICONS[marketName]
      const jupiterBaseToken =
        mangoTokens.find((t) => t.symbol.toLowerCase() === marketName) ||
        mangoTokens.find((t) => t.symbol.toLowerCase()?.includes(marketName))

      baseLogoURI = hasCustomIcon
        ? `/icons/${marketName}.svg`
        : jupiterBaseToken?.logoURI
    }
    return {
      baseLogoURI,
      quoteLogoURI,
      name: market.name.split(/-|\//)[0],
    }
  }, [group, mangoTokens, market])

  const pxSize =
    size === 'xs'
      ? '12'
      : size === 'small'
      ? '16'
      : size === 'large'
      ? '24'
      : '20'

  return (
    <div
      className={`relative ${
        size === 'xs'
          ? 'h-[12px]'
          : size === 'small'
          ? 'mr-1.5 h-4'
          : size === 'large'
          ? 'mr-3 h-6'
          : 'mr-2 h-5'
      } ${
        market instanceof Serum3Market
          ? size === 'xs'
            ? 'w-[23px]'
            : size === 'small'
            ? 'w-[27px]'
            : size === 'large'
            ? 'w-[40px]'
            : 'w-[34px]'
          : size === 'xs'
          ? 'w-[12px]'
          : size === 'small'
          ? 'w-[16px]'
          : size === 'large'
          ? 'w-[24px]'
          : 'w-[20px]'
      } shrink-0`}
    >
      <div className="absolute left-0 top-0 z-10 rounded-full bg-th-bkg-2">
        <LogoWithFallback
          alt=""
          className="shrink-0"
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
            className="shrink-0 opacity-60"
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

const FallbackIcon = ({
  size,
}: {
  size: 'xs' | 'small' | 'medium' | 'large'
}) => {
  return (
    <QuestionMarkCircleIcon
      className={`${
        size === 'small' ? 'h-4 w-4' : size === 'large' ? 'h-6 w-6' : 'h-5 w-5'
      } shrink-0 text-th-fgd-3`}
    />
  )
}
