import { CardinalOrientation, Walktour, WalktourLogic } from 'walktour'
import useLocalStorageState from '../../hooks/useLocalStorageState'
import { ONBOARDING_TOUR_KEY } from '../../utils/constants'
import CustomTooltip from './CustomTooltip'

const TradeOnboardingTour = () => {
  const [, setShowOnboardingTour] = useLocalStorageState(ONBOARDING_TOUR_KEY)

  const renderTooltip = (tourLogic: WalktourLogic | undefined) => {
    const handleClose = () => {
      setShowOnboardingTour(false)
    }

    return <CustomTooltip tourLogic={tourLogic!} customOnClose={handleClose} />
  }

  const steps = [
    {
      selector: '#trade-step-zero',
      title: 'Trade',
      description:
        "The swap you know and love + leverage. Swap lets you trade tokens on their relative strength. Let's say your thesis is BTC will see diminishing returns relative to SOL. You can sell BTC and buy SOL. Now you are long SOL/BTC",
      orientationPreferences: [CardinalOrientation.CENTER],
    },
    {
      selector: '#trade-step-one',
      title: 'Market Selector',
      description: 'Chose the market you want to trade here.',
      orientationPreferences: [CardinalOrientation.SOUTHWEST],
      movingTarget: true,
    },
    {
      selector: '#trade-step-two',
      title: 'Oracle Price',
      description:
        "The oracle price uses an average of price data from many sources. It's used to avoid price manipulation which could lead to liquidations.",
      orientationPreferences: [CardinalOrientation.SOUTHWEST],
      movingTarget: true,
    },
    {
      selector: '#trade-step-three',
      title: 'Toggle Orderbook',
      description:
        'Use these buttons if you only want to see one side of the orderbook. Looking to bid/buy? Toggle off the buy orders to only see the sells and vice versa.',
      orientationPreferences: [CardinalOrientation.SOUTHEAST],
      movingTarget: true,
    },
    {
      selector: '#trade-step-four',
      title: 'Orderbook Grouping',
      description:
        'Adjust the price intervals to change how orders are grouped. Small intervals will show more small orders in the book',
      orientationPreferences: [CardinalOrientation.SOUTHEAST],
      movingTarget: true,
    },
    {
      selector: '#trade-step-five',
      title: 'Recent Trades',
      description:
        'Shows the most recent orders for a market across all accounts.',
      orientationPreferences: [CardinalOrientation.SOUTHEAST],
      movingTarget: true,
    },
    {
      selector: '#trade-step-six',
      title: 'Post Only',
      description:
        "An order condition that will only allow your order to enter the orderbook as a maker order. If the condition can't be met the order will be cancelled.",
      orientationPreferences: [CardinalOrientation.SOUTHEAST],
      movingTarget: true,
    },
    {
      selector: '#trade-step-seven',
      title: 'Immediate or Cancel (IoC)',
      description:
        'An order condition that attempts to execute all or part of an order immediately and then cancels any unfilled portion.',
      orientationPreferences: [CardinalOrientation.SOUTHEAST],
      movingTarget: true,
    },
    {
      selector: '#trade-step-eight',
      title: 'Margin',
      description:
        "When margin is on you can trade with more size than your token balance. Using margin increases your risk of loss. If you're not an experienced trader, use it with caution.",
      orientationPreferences: [CardinalOrientation.SOUTHEAST],
      movingTarget: true,
    },
    {
      selector: '#trade-step-nine',
      title: 'Spread',
      description:
        'The difference between the prices quoted for an immediate sell (ask) and an immediate buy (bid). Or, in other words, the difference between the lowest sell price and the highest buy price.',
      orientationPreferences: [CardinalOrientation.SOUTHEAST],
      movingTarget: true,
    },
    {
      selector: '#trade-step-ten',
      title: 'Unsettled Balance',
      description: 'Description needed...',
      orientationPreferences: [CardinalOrientation.NORTHEAST],
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

export default TradeOnboardingTour
