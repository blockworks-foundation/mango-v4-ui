import { useTranslation } from 'next-i18next'
import { CardinalOrientation, Walktour, WalktourLogic } from 'walktour'
import CustomTooltip from './CustomTooltip'

const TradeOnboardingTour = () => {
  const { t } = useTranslation('onboarding-tours')
  const renderTooltip = (tourLogic: WalktourLogic | undefined) => {
    return <CustomTooltip tourLogic={tourLogic!} hasSeenKey="trade_tour_seen" />
  }

  const steps = [
    {
      selector: '#trade-step-zero',
      title: t('trade'),
      description: t('trade-desc'),
      orientationPreferences: [CardinalOrientation.CENTER],
    },
    {
      selector: '#trade-step-one',
      title: t('market-selector'),
      description: t('market-selector-desc'),
      orientationPreferences: [CardinalOrientation.SOUTHWEST],
      movingTarget: true,
    },
    {
      selector: '#trade-step-two',
      title: t('oracle-price'),
      description: t('oracle-price-desc'),
      orientationPreferences: [CardinalOrientation.SOUTHWEST],
      movingTarget: true,
    },
    {
      selector: '#trade-step-three',
      title: t('toggle-orderbook'),
      description: t('toggle-orderbook-desc'),
      orientationPreferences: [CardinalOrientation.SOUTHEAST],
      movingTarget: true,
    },
    {
      selector: '#trade-step-four',
      title: t('orderbook-grouping'),
      description: t('orderbook-grouping-desc'),
      orientationPreferences: [CardinalOrientation.SOUTHEAST],
      movingTarget: true,
    },
    // {
    //   selector: '#trade-step-five',
    //   title: t('recent-trades'),
    //   description: t('recent-trades-desc'),
    //   orientationPreferences: [CardinalOrientation.SOUTHEAST],
    //   movingTarget: true,
    // },
    {
      selector: '#trade-step-six',
      title: t('post-only'),
      description: t('post-only-desc'),
      orientationPreferences: [CardinalOrientation.SOUTHEAST],
      movingTarget: true,
    },
    {
      selector: '#trade-step-seven',
      title: t('ioc'),
      description: t('ioc-desc'),
      orientationPreferences: [CardinalOrientation.SOUTHEAST],
      movingTarget: true,
    },
    {
      selector: '#trade-step-eight',
      title: t('margin'),
      description: t('margin-desc'),
      orientationPreferences: [CardinalOrientation.SOUTHEAST],
      movingTarget: true,
    },
    {
      selector: '#trade-step-nine',
      title: t('spread'),
      description: t('spread-desc'),
      orientationPreferences: [CardinalOrientation.SOUTHEAST],
      movingTarget: true,
    },
    {
      selector: '#trade-step-ten',
      title: t('unsettled-balance'),
      description: t('unsettled-balance-desc'),
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
