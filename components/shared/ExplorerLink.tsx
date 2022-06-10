type ExplorerLinkProps = {
  address: string
}

const ExplorerLink = ({ address }: ExplorerLinkProps) => {
  const cluster = 'devnet'
  return (
    <a
      href={
        'https://explorer.solana.com/address/' + address + '?cluster=' + cluster
      }
      className="ml-1 text-yellow-400 hover:underline"
      target="_blank"
      rel="noreferrer"
    >
      {address}
    </a>
  )
}

export default ExplorerLink
