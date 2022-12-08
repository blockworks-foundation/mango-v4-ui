import { CLUSTER } from '@store/mangoStore'

type ExplorerLinkProps = {
  address: string
  anchorData?: boolean
  className?: string
}

const ExplorerLink = ({
  address,
  anchorData = false,
  className = '',
}: ExplorerLinkProps) => {
  return (
    <a
      href={`https://explorer.solana.com/address/${address}${
        anchorData ? '/anchor-account' : ''
      }?cluster=${CLUSTER}`}
      className={`ml-1 hover:text-th-active hover:underline ${className}`}
      target="_blank"
      rel="noreferrer"
    >
      {address}
    </a>
  )
}

export default ExplorerLink
