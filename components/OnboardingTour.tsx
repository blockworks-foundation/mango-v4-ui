import { XMarkIcon } from '@heroicons/react/20/solid'
import { useRouter } from 'next/router'
import {
  CardinalOrientation,
  MaskOptions,
  Walktour,
  WalktourLogic,
} from 'walktour'
import useLocalStorageState from '../hooks/useLocalStorageState'
import { ONBOARDING_TOUR_KEY } from '../utils/constants'

const OnboardingTour = () => {
  const [, setShowOnboardingTour] = useLocalStorageState(ONBOARDING_TOUR_KEY)
  const router = useRouter()

  const renderTooltip = (tourLogic: WalktourLogic | undefined) => {
    const { title, description } = tourLogic!.stepContent
    const { next, prev, close, allSteps, stepIndex } = tourLogic!

    const handleClose = () => {
      setShowOnboardingTour(false)
      close()
    }

    return (
      <div className="relative w-72 rounded-lg bg-gradient-to-b from-gradient-start via-gradient-mid to-gradient-end p-4">
        <button
          onClick={handleClose}
          className={`absolute right-4 top-4 z-50 text-th-bkg-3 focus:outline-none md:right-2 md:top-2 md:hover:text-th-primary`}
        >
          <XMarkIcon className={`h-6 w-6`} />
        </button>
        <h3 className="text-th-bkg-1">{title}</h3>
        <p className="text-sm text-th-bkg-1">{description}</p>
        <div className="mt-4 flex items-center justify-between">
          {stepIndex !== 0 ? (
            <button
              className="default-transition h-8 rounded-md border border-th-bkg-1 px-3 font-bold text-th-bkg-1 focus:outline-none md:hover:border-th-bkg-3 md:hover:text-th-bkg-3"
              onClick={() => prev()}
            >
              Back
            </button>
          ) : (
            <div className="h-8 w-[58.25px]" />
          )}
          <div className="flex space-x-2">
            {allSteps.map((s, i) => (
              <div
                className={`h-1 w-1 rounded-full ${
                  i === stepIndex ? 'bg-th-primary' : 'bg-[rgba(0,0,0,0.2)]'
                }`}
                key={s.title}
              />
            ))}
          </div>
          {stepIndex !== allSteps.length - 1 ? (
            <button
              className="default-transition h-8 rounded-md bg-th-bkg-1 px-3 font-bold text-th-fgd-1 focus:outline-none md:hover:bg-th-bkg-3"
              onClick={() => next()}
            >
              Next
            </button>
          ) : (
            <button
              className="default-transition h-8 rounded-md bg-th-bkg-1 px-3 font-bold text-th-fgd-1 focus:outline-none md:hover:bg-th-bkg-3"
              onClick={handleClose}
            >
              Finish
            </button>
          )}
        </div>
      </div>
    )
  }

  const steps = [
    {
      selector: '#step-one',
      title: 'Your Accounts',
      description:
        'Switch between accounts and create new ones. Use multiple accounts to trade isolated margin and protect your capital from liquidation.',
      orientationPreferences: [CardinalOrientation.SOUTHEAST],
      movingTarget: true,
    },
    {
      selector: '#step-two',
      title: 'Account Value',
      description:
        'The value of your assets (deposits) minus the value of your liabilities (borrows).',
      orientationPreferences: [CardinalOrientation.EASTNORTH],
      movingTarget: true,
      customNextFunc: (tourLogic: WalktourLogic) => {
        router.push('/')
        setTimeout(() => tourLogic.next(), 1000)
      },
    },
    {
      selector: '#step-three',
      title: 'Health',
      description:
        'If your account health reaches 0% your account will be liquidated. You can increase the health of your account by making a deposit.',
      orientationPreferences: [CardinalOrientation.SOUTHWEST],
      movingTarget: true,
    },
    {
      selector: '#step-four',
      title: 'Free Collateral',
      description:
        "The amount of capital you have to trade or borrow against. When your free collateral reaches $0 you won't be able to make withdrawals.",
      orientationPreferences: [CardinalOrientation.SOUTHWEST],
      movingTarget: true,
    },
    {
      selector: '#step-five',
      title: 'Total Interest Value',
      description:
        'The value of interest earned (deposits) minus interest paid (borrows).',
      orientationPreferences: [CardinalOrientation.SOUTHWEST],
      movingTarget: true,
    },
    {
      selector: '#step-six',
      title: 'Health Check',
      description:
        'Check the health of your account from any screen in the app. A green heart represents good health, orange okay and red poor.',
      orientationPreferences: [CardinalOrientation.EASTSOUTH],
      movingTarget: true,
      customNextFunc: (tourLogic: WalktourLogic) => {
        router.push('/swap')
        setTimeout(() => tourLogic.next(), 1000)
      },
    },
    {
      selector: '#step-seven',
      title: 'Swap',
      description:
        "You choose the quote token of your trades. This means you can easily trade tokens on their relative strength vs. another token. Let's say your thesis is BTC will see diminishing returns relative to SOL. You can sell BTC and buy SOL. Now you are long SOL/BTC",
      orientationPreferences: [CardinalOrientation.CENTER],
      customPrevFunc: (tourLogic: WalktourLogic) => {
        router.push('/swap')
        tourLogic.prev()
      },
    },
    {
      selector: '#step-eight',
      title: 'Trade Settings',
      description:
        'Edit your slippage settings and toggle margin on and off. When margin is off your trades will be limited by your balance for each token.',
      orientationPreferences: [CardinalOrientation.WESTNORTH],
      movingTarget: true,
    },
    {
      selector: '#step-nine',
      title: 'Token to Sell',
      description:
        'Select the token you want to sell. If your sell size is above your token balance a loan will be opened to cover the shortfall.',
      orientationPreferences: [CardinalOrientation.WESTNORTH],
      movingTarget: true,
    },
    {
      selector: '#step-ten',
      title: 'Health Impact',
      description:
        'Projects the health of your account before you make a trade.',
      orientationPreferences: [CardinalOrientation.WESTNORTH],
      movingTarget: true,
    },
  ]

  return (
    <Walktour
      customTooltipRenderer={renderTooltip}
      steps={steps}
      updateInterval={200}
      disableCloseOnClick
    />
  )
}

export default OnboardingTour
