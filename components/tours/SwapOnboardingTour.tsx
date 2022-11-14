import { useTranslation } from 'next-i18next'
import { CardinalOrientation, Walktour, WalktourLogic } from 'walktour'
import CustomTooltip from './CustomTooltip'

const SwapOnboardingTour = () => {
  const { t } = useTranslation('onboarding-tours')
  const renderTooltip = (tourLogic: WalktourLogic | undefined) => {
    return <CustomTooltip tourLogic={tourLogic!} hasSeenKey="swap_tour_seen" />
  }

  const steps = [
    {
      selector: '#swap-step-zero',
      title: t('swap'),
      description: t('swap-desc'),
      orientationPreferences: [CardinalOrientation.CENTER],
    },
    {
      selector: '#swap-step-one',
      title: t('swap-settings'),
      description: t('swap-settings-desc'),
      orientationPreferences: [CardinalOrientation.WESTNORTH],
      movingTarget: true,
    },
    {
      selector: '#swap-step-two',
      title: t('pay-token'),
      description: t('pay-token-desc'),
      orientationPreferences: [CardinalOrientation.WESTNORTH],
      movingTarget: true,
    },
    {
      selector: '#swap-step-three',
      title: t('receive-token'),
      description: t('receive-token-desc'),
      orientationPreferences: [CardinalOrientation.WESTNORTH],
      movingTarget: true,
    },
    {
      selector: '#swap-step-four',
      title: t('health-impact'),
      description: t('health-impact-desc'),
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
