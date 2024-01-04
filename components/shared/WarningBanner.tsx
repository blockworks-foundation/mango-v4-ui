import { IconButton } from '@components/shared/Button'
import { XMarkIcon } from '@heroicons/react/20/solid'
import Link from 'next/link'
import useIpAddress from 'hooks/useIpAddress'

const BANNER_WRAPPER_CLASSES =
  'flex flex-wrap items-center justify-center bg-th-bkg-1 px-10 py-3 text-xs'

const LINK_TEXT_CLASSES =
  'bg-gradient-to-b from-mango-classic-theme-active to-mango-classic-theme-down bg-clip-text font-bold text-transparent'

const TEXT_CLASSES = 'mx-1 text-center text-th-fgd-1 text-xs'

const WarningBanner = () => {
  const { showWarning } = useIpAddress()

  return showWarning ? (
    <BannerContent
      text={`Don't invest unless you're prepared to lose all the money you invest. This is a high-risk investment and you should not expect to be protected if something goes wrong.`}
      linkText="Learn More"
    />
  ) : null
}

export default WarningBanner

const BannerContent = ({
  text,
  linkText,
  onClickLink,
  onClose,
}: {
  text: string
  linkText: string
  onClickLink?: () => void
  onClose?: () => void
}) => {
  return (
    <div className="relative">
      <div className={BANNER_WRAPPER_CLASSES}>
        <p className={TEXT_CLASSES}>{text}</p>
        <Link
          className={LINK_TEXT_CLASSES}
          href="https://docs.mango.markets/mango-markets/risks"
          onClick={onClickLink}
          target="blank"
        >
          {linkText}
        </Link>
      </div>
      {onClose ? (
        <IconButton
          className="absolute right-0 top-1/2 -translate-y-1/2 sm:right-2"
          hideBg
          onClick={onClose}
          size="medium"
        >
          <XMarkIcon className="h-5 w-5 text-th-fgd-3" />
        </IconButton>
      ) : null}
    </div>
  )
}
