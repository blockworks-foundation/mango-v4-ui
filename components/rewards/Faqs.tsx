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
    <div className="rounded-lg border border-th-bkg-3 p-4">
      <h2 className="mb-2">How it Works</h2>
      <p className="mb-4">
        Feel free to reach out to us on{' '}
        <a
          href="https://discord.gg/2uwjsBc5yw"
          target="_blank"
          rel="noopener noreferrer"
        >
          Discord
        </a>{' '}
        with additional questions.
      </p>
      <div className="border-b border-th-bkg-3">
        {FAQS.map((faq, i) => (
          <Disclosure key={i}>
            {({ open }) => (
              <>
                <Disclosure.Button
                  className={`w-full border-t border-th-bkg-3 p-4 text-left focus:outline-none md:hover:bg-th-bkg-2`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-th-fgd-2">{faq.q}</p>
                    <ChevronDownIcon
                      className={`${
                        open ? 'rotate-180' : 'rotate-360'
                      } h-5 w-5 flex-shrink-0`}
                    />
                  </div>
                </Disclosure.Button>
                <Disclosure.Panel className="p-4">
                  <p>{faq.a}</p>
                </Disclosure.Panel>
              </>
            )}
          </Disclosure>
        ))}
      </div>
    </div>
  )
}

export default Faqs
