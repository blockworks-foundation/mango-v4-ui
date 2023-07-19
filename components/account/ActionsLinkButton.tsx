import { MangoAccount } from '@blockworks-foundation/mango-v4'
import { LinkButton } from '@components/shared/Button'
import { ReactNode } from 'react'

const ActionsLinkButton = ({
  children,
  disabled,
  mangoAccount,
  onClick,
}: {
  children: ReactNode
  disabled?: boolean
  mangoAccount: MangoAccount
  onClick: () => void
}) => {
  return (
    <LinkButton
      className="w-full whitespace-nowrap text-left font-normal"
      disabled={!mangoAccount || disabled}
      onClick={onClick}
    >
      {children}
    </LinkButton>
  )
}

export default ActionsLinkButton
