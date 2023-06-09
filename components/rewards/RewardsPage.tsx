import Button, { LinkButton } from '@components/shared/Button'
import { Disclosure } from '@headlessui/react'
import { ChevronDownIcon, ClockIcon } from '@heroicons/react/20/solid'
// import { useTranslation } from 'next-i18next'
import Image from 'next/image'

const RewardsPage = () => {
  //   const { t } = useTranslation(['common', 'rewards'])
  return (
    <>
      <div className="bg-[url('/images/rewards/madlad-tile.png')]">
        <div className="mx-auto flex max-w-[1140px] flex-col items-center p-8 lg:flex-row lg:px-10 lg:py-14">
          <div className="mb-6 h-[180px] w-[180px] flex-shrink-0 lg:mr-10 lg:mb-0 lg:h-[260px] lg:w-[260px]">
            <Image
              className="rounded-lg shadow-lg"
              src="/images/rewards/madlad.png"
              width={260}
              height={260}
              alt="Top Prize"
            />
            {/* <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
              <Badge
                label="Season 1 – Top Prize!"
                borderColor="var(--bkg-3)"
                fillColor="var(--bkg-3)"
              />
            </div> */}
          </div>
          <div className="flex flex-col items-center lg:items-start">
            <Badge
              label="Season 1"
              borderColor="var(--fgd-3)"
              shadowColor="var(--fgd-3)"
            />
            <p className="my-2 bg-gradient-to-b from-th-active to-th-down bg-clip-text font-display text-2xl text-transparent">
              Mango Mints
            </p>
            <h1 className="mb-3 text-5xl">Win amazing prizes every week.</h1>
            <p className="mb-4 text-lg">
              Earn points by performing actions on Mango. More points equals
              more chances to win.
            </p>
            <LinkButton className="text-lg">How it Works</LinkButton>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center bg-th-bkg-3 px-4 py-3">
        <ClockIcon className="mr-2 h-5 w-5 text-th-active" />
        <p className="text-base text-th-fgd-2">
          Season 1 starts in:{' '}
          <span className="font-bold text-th-fgd-1">4 days</span>
        </p>
      </div>
      <div className="mx-auto grid max-w-[1140px] grid-cols-12 gap-4 p-8 lg:gap-6 lg:p-10">
        <div className="col-span-12 lg:col-span-8">
          <h2 className="mb-4">Rewards Tiers</h2>
          <div className="mb-6 space-y-2">
            <RewardsTierCard
              name="Seed"
              desc="Blah blah blah"
              status="Qualified"
            />
            <RewardsTierCard name="Mango" desc="Blah blah blah" />
            <RewardsTierCard name="Whale" desc="Blah blah blah" />
            <RewardsTierCard name="Bot" desc="Blah blah blah" />
          </div>
          <h2 className="mb-4">FAQs</h2>
          <div className="border-b border-th-bkg-3">
            <Disclosure>
              {({ open }) => (
                <>
                  <Disclosure.Button
                    className={`w-full border-t border-th-bkg-3 p-4 text-left focus:outline-none md:hover:bg-th-bkg-2`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-th-fgd-2">FAQ 1</p>
                      <ChevronDownIcon
                        className={`${
                          open ? 'rotate-180' : 'rotate-360'
                        } h-5 w-5 flex-shrink-0`}
                      />
                    </div>
                  </Disclosure.Button>
                  <Disclosure.Panel className="p-4">
                    <p>FAQ 1 content</p>
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-4">
          <div className="mb-2 rounded-lg border border-th-bkg-3 p-4">
            <h2 className="mb-4">Your Points</h2>
            <div className="mb-4 rounded-md bg-th-bkg-2 p-3">
              <span className="font-display text-3xl text-th-fgd-1">0</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <p>Points Earned</p>
                <p className="font-mono text-th-fgd-2">0</p>
              </div>
              <div className="flex justify-between">
                <p>Streak Bonus</p>
                <p className="font-mono text-th-fgd-2">0x</p>
              </div>
              <div className="flex justify-between">
                <p>Rewards Tier</p>
                <p className="text-th-fgd-2">Seed</p>
              </div>
              <div className="flex justify-between">
                <p>Rank</p>
                <p className="text-th-fgd-2">–</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-th-bkg-3 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="">Top Accounts</h2>
              <Badge
                label="Seed"
                shadowColor="var(--fgd-3)"
                borderColor="var(--fgd-3)"
              />
            </div>
            <div className="border-b border-th-bkg-3">
              <div className="flex items-center justify-between border-t border-th-bkg-3 p-3">
                <div className="flex items-center space-x-2 font-mono">
                  <span>1.</span>
                  <span className="text-th-fgd-3">1a3F...eAu3</span>
                </div>
                <span className="font-mono text-th-fgd-1">0</span>
              </div>
              <div className="flex items-center justify-between border-t border-th-bkg-3 p-3">
                <div className="flex items-center space-x-2 font-mono">
                  <span>2.</span>
                  <span className="text-th-fgd-3">1a3F...eAu3</span>
                </div>
                <span className="font-mono text-th-fgd-1">0</span>
              </div>
              <div className="flex items-center justify-between border-t border-th-bkg-3 p-3">
                <div className="flex items-center space-x-2 font-mono">
                  <span>3.</span>
                  <span className="text-th-fgd-3">1a3F...eAu3</span>
                </div>
                <span className="font-mono text-th-fgd-1">0</span>
              </div>
              <div className="flex items-center justify-between border-t border-th-bkg-3 p-3">
                <div className="flex items-center space-x-2 font-mono">
                  <span>4.</span>
                  <span className="text-th-fgd-3">1a3F...eAu3</span>
                </div>
                <span className="font-mono text-th-fgd-1">0</span>
              </div>
              <div className="flex items-center justify-between border-t border-th-bkg-3 p-3">
                <div className="flex items-center space-x-2 font-mono">
                  <span>5.</span>
                  <span className="text-th-fgd-3">1a3F...eAu3</span>
                </div>
                <span className="font-mono text-th-fgd-1">0</span>
              </div>
            </div>
            <Button className="mt-6 w-full" secondary>
              Full Leaderboard
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

export default RewardsPage

const RewardsTierCard = ({
  name,
  //   imagePath,
  desc,
  status,
}: {
  name: string
  //   imagePath: string
  desc: string
  status?: string
}) => {
  return (
    <div className="rounded-lg border border-th-bkg-3 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="mr-4 h-14 w-14 rounded-full bg-th-bkg-2"></div>
          <div>
            <h3>{name}</h3>
            <p>{desc}</p>
          </div>
        </div>
        {status ? (
          <Badge
            label={status}
            borderColor="var(--success)"
            shadowColor="var(--success)"
          />
        ) : null}
      </div>
    </div>
  )
}

const Badge = ({
  label,
  fillColor,
  shadowColor,
  borderColor,
}: {
  label: string
  fillColor?: string
  shadowColor?: string
  borderColor: string
}) => {
  return (
    <div
      className="w-max rounded-full border px-3 py-1"
      style={{
        background: fillColor ? fillColor : 'transparent',
        borderColor: borderColor,
        boxShadow: shadowColor ? `0px 0px 8px 0px ${shadowColor}` : 'none',
      }}
    >
      <span style={{ color: fillColor ? 'var(--fgd-1)' : borderColor }}>
        {label}
      </span>
    </div>
  )
}
