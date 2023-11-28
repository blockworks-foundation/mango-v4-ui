import { Disclosure } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'

const FAQS = [
  {
    q: 'How do I participate in rewards?',
    a: 'Simply by trading on Mango. Points are allocated for spot trades and swaps. Other actions may also earn points. The more volume you do the more points you earn. At the end of each week prizes are distributed to all wallets with points. The more points you have the more prizes you could win.',
  },
  {
    q: 'What can I win?',
    a: 'Rewards are distributed as tokens like USDC and/or nfts and can differ from week-to-week.',
  },
  {
    q: 'What is a rewards season?',
    a: 'Each weekly cycle is called a Season. They run from midnight Friday UTC to the following midnight Friday UTC.',
  },
  {
    q: 'What are the rewards tiers?',
    a: "There are 4 rewards tiers. Everyone starts in the Seed tier. After your first Season is completed you'll be promoted to either the Mango or Whale tier (depending on the average notional value of your swaps/trades). Bots are automatically assigned to the Bots tier and will remain there.",
  },
  {
    q: 'How do the prizes work?',
    a: "At the end of each Season loot boxes are distributed based on the amount of points earned relative to the other participants in your tier. Everyone will win one or more prizes so you're guaranteed to get something.",
  },
  {
    q: 'How do I claim my rewards?',
    a: 'At the end of each season (midnight Friday UTC) there is a 48 hour window where you can claim your prizes. Come back to this page to claim. If you fail to claim your prizes during this period they will be lost.',
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
