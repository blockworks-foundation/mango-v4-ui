import Image from 'next/image'

const BounceLoader = ({ loadingMessage }: { loadingMessage?: string }) => (
  <div className="flex h-full flex-col items-center justify-center">
    <div className="animate-bounce">
      <Image src="/icons/mngo.svg" alt="" width="32" height="32" />
    </div>
    {loadingMessage ? <p className="text-center">{loadingMessage}</p> : null}
  </div>
)

export default BounceLoader
