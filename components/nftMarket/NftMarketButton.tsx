import { ReactNode } from 'react'

const NftMarketButton = ({
  className,
  colorClass,
  text,
  onClick,
}: {
  className?: string
  colorClass: string
  text: string | ReactNode
  onClick: () => void
}) => {
  return (
    <button
      className={`flex justify-center rounded-b rounded-t border border-th-${colorClass} px-2 py-1 text-th-${colorClass} font-bold focus:outline-none md:hover:brightness-75 ${className}`}
      onClick={onClick}
    >
      {text}
    </button>
  )
}

export default NftMarketButton
