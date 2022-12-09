import Image from 'next/image'
import { ReactElement, useEffect, useState } from 'react'

const LogoWithFallback = ({
  fallback,
  alt,
  src,
  ...props
}: {
  fallback: ReactElement
  alt: string
  src: string
  [x: string]: string | boolean | ReactElement
}) => {
  const [error, setError] = useState(false)

  useEffect(() => {
    setError(false)
  }, [src])

  return (
    <>
      {!error ? (
        <Image
          alt={alt}
          onError={(e) => {
            console.warn('error', e)
            setError(true)
          }}
          src={src}
          {...props}
        />
      ) : (
        fallback
      )}
    </>
  )
}

export default LogoWithFallback
