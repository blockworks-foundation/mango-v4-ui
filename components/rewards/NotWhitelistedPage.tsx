const NotWhitelistedPage = () => {
  return (
    <>
      <div className="banner-wrapper relative mx-auto mb-8 flex flex-col items-center justify-center border-b border-th-bkg-3 p-8 lg:mb-12 lg:px-10 lg:py-12">
        <div className="absolute left-0 top-0 mt-3 h-[64px] w-[200%] animate-[moveRightLeft_240s_linear_infinite] bg-[url('/images/rewards/mints-banner-bg-1.png')] bg-contain bg-center bg-repeat-x opacity-30" />
        <div className="absolute bottom-0 right-0 mb-3 h-[64px] w-[200%] animate-[moveLeftRight_300s_linear_infinite] bg-[url('/images/rewards/mints-banner-bg-2.png')] bg-contain bg-center bg-repeat-x opacity-30" />
        <div className="relative z-10">
          <h1 className="my-2 text-center font-rewards text-5xl lg:text-6xl">
            Trade. Win. Repeat.
          </h1>
          <p className="max-w-2xl text-center text-base leading-snug text-th-fgd-2 lg:text-xl">
            Earn rewards every week by trading on Mango. More points equals more
            chances to win big.
          </p>
        </div>
      </div>
      <div className="px-4">
        <div className="mx-auto flex max-w-2xl flex-col items-center rounded-xl border border-th-bkg-3 p-6">
          <span className="mb-2 text-center text-5xl">👀</span>
          <h2 className="mb-1 text-center font-rewards text-3xl">
            You&apos;re not eligible for rewards... Yet.
          </h2>
          <p className="text-center text-base">
            Keep an eye on our{' '}
            <a
              href="https://twitter.com/mangomarkets"
              target="_blank"
              rel="noopener noreferrer"
            >
              Twitter
            </a>{' '}
            to gain access.
          </p>
        </div>
      </div>
    </>
  )
}

export default NotWhitelistedPage
