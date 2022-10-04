import { CardinalOrientation, Walktour, WalktourLogic } from 'walktour'
import CustomTooltip from './CustomTooltip'

const TradeOnboardingTour = () => {
  const renderTooltip = (tourLogic: WalktourLogic | undefined) => {
    return <CustomTooltip tourLogic={tourLogic!} hasSeenKey="trade_tour_seen" />
  }

  const steps = [
    {
      selector: '#trade-step-zero',
      title: 'Trade 100s of Tokens...',
      description:
        'A refined interface without listing limits. The tokens you want to trade are now on Mango and no longer only quoted in USDC.',
      orientationPreferences: [CardinalOrientation.CENTER],
    },
    {
      selector: '#trade-step-one',
      title: 'Market Selector',
      description: 'Chose the market you want to trade.',
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
      description:
        'When a limit order is filled, the funds are placed in your unsettled balances. When you have an unsettled balance you\'ll see a "Settle All" button above this table. Use it to move the funds to your account balance.',
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
