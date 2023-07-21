import { Bank } from '@blockworks-foundation/mango-v4'
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid'
import useJupiterMints from 'hooks/useJupiterMints'
import Image from 'next/image'
import { useMemo } from 'react'
import { CUSTOM_TOKEN_ICONS } from 'utils/constants'

const TokenLogo = ({
  bank,
  size,
}: {
  bank: Bank | undefined
  size?: number
}) => {
  const { mangoTokens } = useJupiterMints()

  const logoUri = useMemo(() => {
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
  }, [mangoTokens, bank])

  const logoSize = size ? size : 24

  return logoUri ? (
    <div
      className={`h-[${logoSize}px] w-[${logoSize}px] rounded-full bg-th-bkg-2`}
    >
      <Image alt="" width={logoSize} height={logoSize} src={logoUri} />
    </div>
  ) : (
    <QuestionMarkCircleIcon
      className={`h-[${logoSize}px] w-[${logoSize}px] text-th-fgd-3`}
    />
  )
}

export default TokenLogo
