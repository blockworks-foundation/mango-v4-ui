import { driver } from 'driver.js'
import { ttCommons } from './fonts'
import { UI_TOURS_KEY } from './constants'

export enum TOURS {
  ACCOUNT,
  SWAP,
  TRADE,
}

// function to create account tour with dynamic steps
const createAccountTour = (mangoAccountPk: string | undefined) => {
  return driver({
    nextBtnText: 'Next',
    prevBtnText: 'Previous',
    doneBtnText: 'Done',
    popoverClass: 'ui-tour',
    showProgress: true,
    onPopoverRender: () => {
      const fonts = document.getElementById('driver-popover-content')
      if (fonts) {
        fonts.classList.add(ttCommons.variable, 'font-sans')
      }
    },
    onDestroyed: () => {
      const completedToursString = localStorage.getItem(UI_TOURS_KEY)
      const completedTours = completedToursString
        ? JSON.parse(completedToursString)
        : []
      if (!completedTours.includes(TOURS.ACCOUNT)) {
        localStorage.setItem(
          UI_TOURS_KEY,
          JSON.stringify([...completedTours, TOURS.ACCOUNT]),
        )
      }
    },
    steps: [
      {
        popover: {
          title: 'Take the Tour',
          description: "We'll show you the ropes of your account page.",
        },
      },
      {
        element: '#account-tabs',
        popover: {
          title: 'Mission Control',
          description:
            'Detailed views for everything you need to manage your account.',
        },
      },
      {
        element: '#account-refresh',
        popover: {
          title: 'Feeling Refreshed Yet?',
          description:
            'Your account data will update automatically but you can also manually refresh it here.',
        },
      },
      {
        element: '#account-chart',
        popover: {
          title: mangoAccountPk
            ? 'Your Mango Net Worth'
            : 'Account value chart',
          description: mangoAccountPk
            ? 'The value and trend of your Mango Account with quick action buttons.'
            : 'When you create your account a chart of the value will show here.',
        },
      },
      {
        element: '#account-health',
        popover: {
          title: 'Health is Wealth',
          description:
            'If you use margin you need to keep your account health above 0% to prevent liquidation. Hit the bar chart icon for a detailed view.',
        },
      },
      {
        element: '#account-free-collateral',
        popover: {
          title: 'Your Bankroll',
          description:
            "The amount of capital you have to use for trades and loans. If your free collateral reaches $0 you won't be able to open new positions, borrow or withdraw collateral.",
        },
      },
      {
        element: '#account-pnl',
        popover: {
          title: 'Are ya Winning?',
          description:
            'How much $ your account has made or lost. PnL accounts for changes in the spot prices of your deposits and your positions. Hit the calendar icon to view your PnL history.',
        },
      },
      {
        element: '#account-more-stats',
        popover: {
          title: "But Wait. There's More...",
          description:
            'Charts and historical stats for PnL, interest, funding and volume.',
        },
      },
      {
        element: '#account-explore-tabs',
        popover: {
          title: 'Explore Mango',
          description:
            'Stats on our listed tokens and markets and your followed accounts. Visit the leaderboard to start finding accounts to follow.',
        },
      },
    ],
  })
}

export const startAccountTour = (mangoAccountPk: string | undefined) => {
  const accountTour = createAccountTour(mangoAccountPk)
  accountTour.drive()
}
