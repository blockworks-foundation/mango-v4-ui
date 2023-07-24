import { PhotoIcon } from '@heroicons/react/20/solid'
import { useState } from 'react'

export const ImgWithLoader = (props: {
  className: string
  src: string
  alt: string
}) => {
  const [isLoading, setIsLoading] = useState(true)
  return (
    <div className="relative">
      {isLoading && (
        <PhotoIcon className="absolute left-1/2 top-1/2 z-10 h-1/4 w-1/4 -translate-x-1/2 -translate-y-1/2 animate-pulse text-th-fgd-4" />
      )}
      <img {...props} onLoad={() => setIsLoading(false)} alt={props.alt} />
    </div>
  )
}
