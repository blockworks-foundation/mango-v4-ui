import { CardinalOrientation, Walktour, WalktourLogic } from 'walktour'
import useLocalStorageState from '../../hooks/useLocalStorageState'
import { ONBOARDING_TOUR_KEY } from '../../utils/constants'
import CustomTooltip from './CustomTooltip'

const AccountOnboardingTour = () => {
  const [, setShowOnboardingTour] = useLocalStorageState(ONBOARDING_TOUR_KEY)

  const renderTooltip = (tourLogic: WalktourLogic | undefined) => {
    const handleClose = () => {
      setShowOnboardingTour(false)
    }

    return <CustomTooltip tourLogic={tourLogic!} customOnClose={handleClose} />
  }

  const steps = [
    {
      selector: '#account-step-one',
      title: 'Profile Menu',
      description:
        "If you haven't chosen a profile name yet, you'll see your assigned one here. You can edit it and change your profile picture from this menu.",
      orientationPreferences: [CardinalOrientation.SOUTHEAST],
      movingTarget: true,
    },
    {
      selector: '#account-step-two',
      title: 'Your Accounts',
      description:
        'Switch between accounts and create new ones. Use multiple accounts to trade isolated margin and protect your capital from liquidation.',
      orientationPreferences: [CardinalOrientation.SOUTHEAST],
      movingTarget: true,
    },
    {
      selector: '#account-step-three',
      title: 'Account Value',
      description:
        'The value of your assets (deposits) minus the value of your liabilities (borrows).',
      orientationPreferences: [CardinalOrientation.EASTNORTH],
      movingTarget: true,
    },
    {
      selector: '#account-step-four',
      title: 'Health',
      description:
        'If your account health reaches 0% your account will be liquidated. You can increase the health of your account by making a deposit.',
      orientationPreferences: [CardinalOrientation.SOUTHWEST],
      movingTarget: true,
    },
    {
      selector: '#account-step-five',
      title: 'Free Collateral',
      description:
        "The amount of capital you have to trade or borrow against. When your free collateral reaches $0 you won't be able to make withdrawals.",
      orientationPreferences: [CardinalOrientation.SOUTHWEST],
      movingTarget: true,
    },
    {
      selector: '#account-step-six',
      title: 'PnL (Profit and Loss)',
      description: 'The amount your account has made or lost.',
      orientationPreferences: [CardinalOrientation.SOUTHWEST],
      movingTarget: true,
    },
    {
      selector: '#account-step-seven',
      title: 'Total Interest Value',
      description:
        'The value of interest earned (deposits) minus interest paid (borrows).',
      orientationPreferences: [CardinalOrientation.SOUTHWEST],
      movingTarget: true,
    },
    {
      selector: '#account-step-eight',
      title: 'Health Check',
      description:
        'Check the health of your account from any screen in the app. A green heart represents good health, orange okay and red poor.',
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
