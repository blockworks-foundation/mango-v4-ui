import { Disclosure } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'

const FAQS = [
  {
    q: 'What is Mango Mints?',
    a: 'Mango Mints is a weekly rewards program with amazing prizes. Anyone can participate simply by performing actions on Mango.',
  },
  {
    q: 'How do I participate?',
    a: "Simply by using Mango. Points are allocated for transactions across the platform (swaps, trades, orders and more). You'll receive a notificaton when you earn points (make sure notifications are enabled for your wallet).",
  },
  {
    q: 'How do Seasons work?',
    a: 'Each weekly cycle is called a Season and each Season has two periods. The first period is about earning points and runs from midnight Sunday UTC to midnight Friday UTC. The second period is allocated to claim prizes and runs from midnight Friday UTC to midnight Sunday UTC.',
  },
  {
    q: 'What are the rewards tiers?',
    a: "There are 4 rewards tiers. Everyone starts in the Seed tier. After your first Season is completed you'll be promoted to either the Mango or Whale tier (depending on the average notional value of your swaps/trades). Bots are automatically assigned to the Bots tier and will remain there.",
  },
  {
    q: 'How do the prizes work?',
    a: "At the end of each Season loot boxes are distributed based on the amount of points earned relative to the other participants in your tier. Each box contains a prize. So you're guaranteed to get something.",
  },
  {
    q: 'What happens during the Season claim period?',
    a: "During the claim period you can come back to this page and often as you like and open your loot boxes. However, if you don't claim your prizes during this time window they will be lost.",
  },
]

const Faqs = () => {
  return (
    <div className="rounded-2xl border border-th-bkg-3 p-6">
      <h2 className="rewards-h2">How it Works</h2>
      <p className="rewards-p mb-4">
        Feel free to reach out to us on{' '}
        <a
          className="text-th-active"
          href="https://discord.gg/2uwjsBc5yw"
          target="_blank"
          rel="noopener noreferrer"
        >
          Discord
        </a>{' '}
        with additional questions.
      </p>
      <div>
        {FAQS.map((faq, i) => (
          <Disclosure key={i}>
            {({ open }) => (
              <div className="mb-2 last:mb-0">
                <Disclosure.Button
                  className={`w-full rounded-lg bg-th-bkg-2 p-4 text-left focus:outline-none md:hover:bg-th-bkg-3 ${
                    open ? 'rounded-b-none' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="rewards-p font-bold">{faq.q}</p>
                    <ChevronDownIcon
                      className={`${
                        open ? 'rotate-180' : 'rotate-360'
                      } h-6 w-6 flex-shrink-0 text-th-fgd-3`}
                    />
                  </div>
                </Disclosure.Button>
                <Disclosure.Panel className="rounded-b-lg bg-th-bkg-2 p-4">
                  <p className="rewards-p">{faq.a}</p>
                </Disclosure.Panel>
              </div>
            )}
          </Disclosure>
        ))}
      </div>
    </div>
  )
}

export default Faqs
