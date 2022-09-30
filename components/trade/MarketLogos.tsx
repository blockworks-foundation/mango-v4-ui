import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid'
import Image from 'next/image'

const MarketLogos = ({
  baseURI,
  quoteURI,
}: {
  baseURI: string
  quoteURI: string
}) => {
  return (
    <div className="relative mr-1.5 h-5 w-[34px]">
      <div className="absolute left-0 top-0">
        {baseURI ? (
          <Image
            alt=""
            className="z-10 rounded-full drop-shadow-md"
            width="20"
            height="20"
            src={baseURI}
          />
        ) : (
          <QuestionMarkCircleIcon className="h-5 w-5 text-th-fgd-3" />
        )}
      </div>
      <div className="absolute right-0 top-0">
        {quoteURI ? (
          <Image
            alt=""
            className="rounded-full opacity-60"
            width="20"
            height="20"
            src={quoteURI}
          />
        ) : (
          <QuestionMarkCircleIcon className="h-5 w-5 text-th-fgd-3" />
        )}
      </div>
    </div>
  )
}

export default MarketLogos
