import { LinkButton } from '@components/shared/Button'
import useMangoAccount from 'hooks/useMangoAccount'
import { ReactNode } from 'react'

const ActionsLinkButton = ({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode
  disabled?: boolean
  onClick: () => void
}) => {
  const { mangoAccountAddress } = useMangoAccount()
  return (
    <LinkButton
      className="w-full whitespace-nowrap text-left font-normal"
      disabled={!mangoAccountAddress || disabled}
      onClick={onClick}
    >
      {children}
    </LinkButton>
  )
}

export default ActionsLinkButton
