import { NoSymbolIcon } from '@heroicons/react/20/solid'

const EmptyState = ({ text }: { text: string }) => {
  return (
    <div className="mt-4 flex flex-col items-center rounded-md border border-th-bkg-3 p-4">
      <NoSymbolIcon className="mb-1 h-7 w-7 text-th-fgd-4" />
      <p>{text}</p>
    </div>
  )
}

export default EmptyState
