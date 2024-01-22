import { Bank } from '@blockworks-foundation/mango-v4'
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid'
import useJupiterMints from 'hooks/useJupiterMints'
import Image from 'next/image'
import { useMemo } from 'react'
import { CUSTOM_TOKEN_ICONS } from 'utils/constants'
import Tooltip from './Tooltip'

const TokenLogo = ({
  bank,
  logoUrl,
  showRewardsLogo,
  size,
}: {
  bank: Bank | undefined
  logoUrl?: string
  showRewardsLogo?: boolean
  size?: number
}) => {
  const { mangoTokens } = useJupiterMints()

  const logoUri = useMemo(() => {
    if (logoUrl) return logoUrl
    if (!bank) return ''
    const tokenSymbol = bank.name.toLowerCase()
    const hasCustomIcon = CUSTOM_TOKEN_ICONS[tokenSymbol]
    if (hasCustomIcon) return `/icons/${tokenSymbol}.svg`
    let jupiterLogoURI
    if (mangoTokens?.length) {
      jupiterLogoURI = mangoTokens.find(
        (t) => t.address === bank?.mint.toString(),
      )?.logoURI
    }
    return jupiterLogoURI
  }, [mangoTokens, bank, logoUrl])

  const logoSize = size ? size : 24

  return logoUri ? (
    <Tooltip
      content={
        showRewardsLogo ? (
          bank?.name === 'MSOL' ? (
            <>
              <p className="mb-2">
                Earn MNDE tokens for holding your mSOL on Mango
              </p>
              <a
                href="https://marinade.finance/blog/let-marinade-earn-season-2-begin/"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Details
              </a>
            </>
          ) : bank?.name === 'bSOL' ? (
            <>
              <p className="mb-2">
                Earn BLZE tokens for holding your bSOL on Mango
              </p>
              <a
                href="https://rewards.solblaze.org/"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Details
              </a>
            </>
          ) : null
        ) : null
      }
    >
      <div
        className={`h-[${logoSize}px] w-[${logoSize}px] relative rounded-full bg-th-bkg-2 ${
          bank?.name === 'MSOL' || bank?.name === 'bSOL' ? 'cursor-help' : ''
        }`}
      >
        <Image alt="" width={logoSize} height={logoSize} src={logoUri} />
        {showRewardsLogo ? (
          <>
            {bank?.name === 'MSOL' ? (
              <div className="absolute -right-1.5 -top-1.5 shadow">
                <Image alt="" width={16} height={16} src={'/icons/mnde.svg'} />
              </div>
            ) : null}
            {bank?.name === 'bSOL' ? (
              <div className="absolute -right-1.5 -top-1.5 shadow">
                <Image alt="" width={16} height={16} src={'/icons/blze.svg'} />
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </Tooltip>
  ) : (
    <QuestionMarkCircleIcon
      className={`h-[${logoSize}px] w-[${logoSize}px] text-th-fgd-3`}
    />
  )
}

export default TokenLogo
