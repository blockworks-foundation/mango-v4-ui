import Image from 'next/legacy/image'

const BounceLoader = ({ loadingMessage }: { loadingMessage?: string }) => (
  <div className="flex h-full flex-col items-center justify-center">
    <div className="animate-bounce">
      <Image src="/logos/logo-mark.svg" alt="" width="32" height="32" />
    </div>
    {loadingMessage ? <p className="text-center">{loadingMessage}</p> : null}
  </div>
)

export default BounceLoader
