import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid'
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
      className={`flex items-center break-all text-th-fgd-2 hover:text-th-fgd-3 ${className}`}
      target="_blank"
      rel="noreferrer"
    >
      {address}
      <ArrowTopRightOnSquareIcon className="ml-2 h-5 w-5 whitespace-nowrap" />
    </a>
  )
}

export default ExplorerLink
