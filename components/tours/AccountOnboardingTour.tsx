import { useTranslation } from 'next-i18next'
import { CardinalOrientation, Walktour, WalktourLogic } from 'walktour'
import CustomTooltip from './CustomTooltip'

const AccountOnboardingTour = () => {
  const { t } = useTranslation('onboarding-tours')
  const renderTooltip = (tourLogic: WalktourLogic | undefined) => {
    return (
      <CustomTooltip hasSeenKey="account_tour_seen" tourLogic={tourLogic!} />
    )
  }

  const steps = [
    {
      selector: '#account-step-zero',
      title: t('account-dashboard'),
      description: t('account-dashboard-desc'),
      orientationPreferences: [CardinalOrientation.SOUTHEAST],
      movingTarget: true,
    },
    {
      selector: '#account-step-one',
      title: t('profile-menu'),
      description: t('profile-menu-desc'),
      orientationPreferences: [CardinalOrientation.SOUTHEAST],
      movingTarget: true,
    },
    {
      selector: '#account-step-two',
      title: t('your-accounts'),
      description: t('your-accounts-desc'),
      orientationPreferences: [CardinalOrientation.SOUTHEAST],
      movingTarget: true,
    },
    {
      selector: '#account-step-three',
      title: t('account-value'),
      description: t('account-value-desc'),
      orientationPreferences: [CardinalOrientation.EASTNORTH],
      movingTarget: true,
    },
    {
      selector: '#account-step-four',
      title: t('health'),
      description: t('health-desc'),
      orientationPreferences: [CardinalOrientation.SOUTHWEST],
      movingTarget: true,
    },
    {
      selector: '#account-step-five',
      title: t('free-collateral'),
      description: t('free-collateral-desc'),
      orientationPreferences: [CardinalOrientation.SOUTHWEST],
      movingTarget: true,
    },
    {
      selector: '#account-step-six',
      title: t('leverage'),
      description: t('leverage-desc'),
      orientationPreferences: [CardinalOrientation.SOUTHWEST],
      movingTarget: true,
    },
    {
      selector: '#account-step-seven',
      title: t('pnl'),
      description: t('pnl-desc'),
      orientationPreferences: [CardinalOrientation.SOUTHWEST],
      movingTarget: true,
    },
    {
      selector: '#account-step-eight',
      title: t('total-interest-earned'),
      description: t('total-interest-earned-desc'),
      orientationPreferences: [CardinalOrientation.SOUTHEAST],
      movingTarget: true,
    },
    {
      selector: '#account-step-nine',
      title: t('interest-earned'),
      description: t('interest-earned-desc'),
      orientationPreferences: [CardinalOrientation.SOUTHEAST],
      movingTarget: true,
    },
    {
      selector: '#account-step-ten',
      title: t('rates'),
      description: t('rates-desc'),
      orientationPreferences: [CardinalOrientation.SOUTHEAST],
      movingTarget: true,
    },
    {
      selector: '#account-step-eleven',
      title: t('account-summary'),
      description: t('account-summary-desc'),
      orientationPreferences: [CardinalOrientation.EASTSOUTH],
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

export default AccountOnboardingTour
