import { CardinalOrientation, Walktour, WalktourLogic } from 'walktour'
import CustomTooltip from './CustomTooltip'

const SwapOnboardingTour = () => {
  const renderTooltip = (tourLogic: WalktourLogic | undefined) => {
    return <CustomTooltip tourLogic={tourLogic!} hasSeenKey="swap_tour_seen" />
  }

  const steps = [
    {
      selector: '#swap-step-zero',
      title: "We've Juiced Swap",
      description:
        "The swap you know and love + leverage. Swap lets you trade tokens on their relative strength. Let's say your thesis is BTC will see diminishing returns relative to SOL. You can sell BTC and buy SOL. Now you are long SOL/BTC",
      orientationPreferences: [CardinalOrientation.CENTER],
    },
    {
      selector: '#swap-step-one',
      title: 'Swap Settings',
      description:
        'Edit your slippage settings and toggle margin on and off. When margin is off your swaps will be limited by your balance for each token.',
      orientationPreferences: [CardinalOrientation.WESTNORTH],
      movingTarget: true,
    },
    {
      selector: '#swap-step-two',
      title: 'From Token',
      description:
        'Select the token you want to swap from (sell). If you have margin on and your size is above your token balance a loan will be opened to cover the shortfall. Check the borrow rate before making a margin swap.',
      orientationPreferences: [CardinalOrientation.WESTNORTH],
      movingTarget: true,
    },
    {
      selector: '#swap-step-three',
      title: 'To Token',
      description:
        "The token you'll receive in your Mango Account after making a swap. You can think of this token as the one you're buying/longing.",
      orientationPreferences: [CardinalOrientation.WESTNORTH],
      movingTarget: true,
    },
    {
      selector: '#swap-step-four',
      title: 'Health Impact',
      description:
        'Projects the health of your account before you make a swap. The first value is your current account health and the second, your projected account health.',
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

export default SwapOnboardingTour
