import Select from '@components/forms/Select'
import AcornIcon from '@components/icons/AcornIcon'
import MangoIcon from '@components/icons/MangoIcon'
import RobotIcon from '@components/icons/RobotIcon'
import WhaleIcon from '@components/icons/WhaleIcon'
import Button, { LinkButton } from '@components/shared/Button'
import Modal from '@components/shared/Modal'
import { Disclosure } from '@headlessui/react'
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
} from '@heroicons/react/20/solid'
// import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import { ReactNode, RefObject, useEffect, useRef, useState } from 'react'
import Particles from 'react-tsparticles'
import { ModalProps } from 'types/modal'
import Leaderboards from './Leaderboards'
import { useQuery } from '@tanstack/react-query'
import { useWallet } from '@solana/wallet-adapter-react'
import { MANGO_DATA_API_URL } from 'utils/constants'
import { formatNumericValue } from 'utils/numbers'
import SheenLoader from '@components/shared/SheenLoader'
import { abbreviateAddress } from 'utils/formatting'
import { PublicKey } from '@solana/web3.js'
import { useTranslation } from 'next-i18next'
import { useIsWhiteListed } from 'hooks/useIsWhiteListed'
import InlineNotification from '@components/shared/InlineNotification'

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

export type RewardsLeaderboardItem = {
  points: number
  tier: string
  wallet_pk: string
}

export const tiers = ['seed', 'mango', 'whale', 'bot']

const fetchRewardsPoints = async (walletPk: string | undefined) => {
  try {
    const data = await fetch(
      `${MANGO_DATA_API_URL}/user-data/campaign-total-points-wallet?wallet-pk=${walletPk}`,
    )
    const res = await data.json()
    return res
  } catch (e) {
    console.log('Failed to fetch points', e)
  }
}

export const fetchLeaderboard = async (tier: string | undefined) => {
  try {
    const data = await fetch(
      `${MANGO_DATA_API_URL}/user-data/campaign-leaderboard?tier=${tier}`,
    )
    const res = await data.json()
    return res
  } catch (e) {
    console.log('Failed to top accounts leaderboard', e)
  }
}

const RewardsPage = () => {
  //   const { t } = useTranslation(['common', 'rewards'])
  const [showClaim] = useState(true)
  const { data: isWhiteListed, isLoading, isFetching } = useIsWhiteListed()
  const [showLeaderboards, setShowLeaderboards] = useState('')
  const [showWhitelistModal, setShowWhitelistModal] = useState(false)
  const faqRef = useRef<HTMLDivElement>(null)

  const scrollToFaqs = () => {
    if (faqRef.current) {
      faqRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start', // or 'end' or 'center'
      })
    }
  }

  useEffect(() => {
    if (!isWhiteListed && !isLoading && !isFetching) {
      setShowWhitelistModal(true)
    }
  }, [isWhiteListed, isLoading, isFetching])

  return !showLeaderboards ? (
    <>
      <div className="bg-[url('/images/rewards/madlad-tile.png')]">
        <div className="mx-auto flex max-w-[1140px] flex-col items-center p-8 lg:flex-row lg:p-10">
          <div className="mb-6 h-[180px] w-[180px] flex-shrink-0 lg:mb-0 lg:mr-10 lg:h-[220px] lg:w-[220px]">
            <Image
              className="rounded-lg shadow-lg"
              priority
              src="/images/rewards/madlad.png"
              width={260}
              height={260}
              alt="Top Prize"
            />
          </div>
          <div className="flex flex-col items-center lg:items-start">
            <Badge
              label="Season 1"
              borderColor="var(--active)"
              shadowColor="var(--active)"
            />
            <h1 className="my-2 text-center text-4xl lg:text-left">
              Win amazing prizes every week.
            </h1>
            <p className="mb-4 text-center text-lg leading-snug lg:text-left">
              Earn points by performing actions on Mango. More points equals
              more chances to win.
            </p>
            <Button size="large" onClick={scrollToFaqs}>
              How it Works
            </Button>
          </div>
        </div>
      </div>
      {!showClaim ? (
        <Claim />
      ) : (
        <Season
          faqRef={faqRef}
          showLeaderboard={setShowLeaderboards}
          setShowWhitelistModal={() => setShowWhitelistModal(true)}
        />
      )}
      {showWhitelistModal ? (
        <WhitelistWalletModal
          isOpen={showWhitelistModal}
          onClose={() => setShowWhitelistModal(false)}
        />
      ) : null}
    </>
  ) : (
    <Leaderboards
      leaderboard={showLeaderboards}
      goBack={() => setShowLeaderboards('')}
    />
  )
}

export default RewardsPage

const Season = ({
  faqRef,
  showLeaderboard,
  setShowWhitelistModal,
}: {
  faqRef: RefObject<HTMLDivElement>
  showLeaderboard: (x: string) => void
  setShowWhitelistModal: () => void
}) => {
  const { t } = useTranslation(['common', 'rewards'])
  const { wallet } = useWallet()
  const [topAccountsTier, setTopAccountsTier] = useState('seed')
  const { data: isWhiteListed } = useIsWhiteListed()
  const {
    data: walletRewardsData,
    isFetching: fetchingWalletRewardsData,
    isLoading: loadingWalletRewardsData,
  } = useQuery(
    ['rewards-points', wallet?.adapter.publicKey],
    () => fetchRewardsPoints(wallet?.adapter.publicKey?.toString()),
    {
      cacheTime: 1000 * 60 * 10,
      staleTime: 1000 * 60,
      retry: 3,
      refetchOnWindowFocus: false,
      enabled: !!wallet?.adapter,
    },
  )

  const {
    data: topAccountsLeaderboardData,
    isFetching: fetchingTopAccountsLeaderboardData,
    isLoading: loadingTopAccountsLeaderboardData,
  } = useQuery(
    ['top-accounts-leaderboard-data', topAccountsTier],
    () => fetchLeaderboard(topAccountsTier),
    {
      cacheTime: 1000 * 60 * 10,
      staleTime: 1000 * 60,
      retry: 3,
      refetchOnWindowFocus: false,
    },
  )

  useEffect(() => {
    if (walletRewardsData?.tier) {
      setTopAccountsTier(walletRewardsData.tier)
    }
  }, [walletRewardsData])

  const isLoadingWalletData =
    fetchingWalletRewardsData || loadingWalletRewardsData

  const isLoadingLeaderboardData =
    fetchingTopAccountsLeaderboardData || loadingTopAccountsLeaderboardData

  return (
    <>
      <div className="flex items-center justify-center bg-th-bkg-3 px-4 py-3">
        <ClockIcon className="mr-2 h-5 w-5 text-th-active" />
        <p className="text-base text-th-fgd-2">
          Season 1 starts in:{' '}
          <span className="mr-4 font-bold text-th-fgd-1">4 days</span>
        </p>
      </div>
      <div className="mx-auto grid max-w-[1140px] grid-cols-12 gap-4 p-8 lg:gap-6 lg:p-10">
        {!isWhiteListed ? (
          <div className="col-span-12">
            <InlineNotification
              desc={
                <>
                  <span>
                    You need to whitelist your wallet to claim any rewards you
                    win
                  </span>
                  <LinkButton className="mt-2" onClick={setShowWhitelistModal}>
                    Get Whitelisted
                  </LinkButton>
                </>
              }
              title="Wallet not whitelisted"
              type="warning"
            />
          </div>
        ) : null}
        <div className="col-span-12 lg:col-span-8">
          <div className="mb-2 rounded-lg border border-th-bkg-3 p-4">
            <h2 className="mb-4">Rewards Tiers</h2>
            <div className="mb-6 space-y-2">
              <RewardsTierCard
                icon={<AcornIcon className="h-8 w-8 text-th-fgd-2" />}
                name="seed"
                desc="All new participants start here"
                showLeaderboard={showLeaderboard}
                status={walletRewardsData?.tier === 'seed' ? 'Qualified' : ''}
              />
              <RewardsTierCard
                icon={<MangoIcon className="h-8 w-8 text-th-fgd-2" />}
                name="mango"
                desc="Average swap/trade value less than $1,000"
                showLeaderboard={showLeaderboard}
                status={walletRewardsData?.tier === 'mango' ? 'Qualified' : ''}
              />
              <RewardsTierCard
                icon={<WhaleIcon className="h-8 w-8 text-th-fgd-2" />}
                name="whale"
                desc="Average swap/trade value greater than $1,000"
                showLeaderboard={showLeaderboard}
                status={walletRewardsData?.tier === 'whale' ? 'Qualified' : ''}
              />
              <RewardsTierCard
                icon={<RobotIcon className="h-8 w-8 text-th-fgd-2" />}
                name="bot"
                desc="All bots"
                showLeaderboard={showLeaderboard}
                status={walletRewardsData?.tier === 'bot' ? 'Qualified' : ''}
              />
            </div>
          </div>
          <div ref={faqRef}>
            <Faqs />
          </div>
        </div>
        <div className="col-span-12 lg:col-span-4">
          <div className="mb-2 rounded-lg border border-th-bkg-3 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2>Your Points</h2>
              {isWhiteListed ? (
                <Badge
                  label="Whitelisted"
                  borderColor="var(--success)"
                  shadowColor="var(--success)"
                />
              ) : null}
            </div>
            <div className="mb-4 flex h-14 w-full items-center rounded-md bg-th-bkg-2 px-3">
              <span className="w-full font-display text-3xl text-th-fgd-1">
                {!isLoadingWalletData ? (
                  walletRewardsData?.points ? (
                    formatNumericValue(walletRewardsData.points)
                  ) : wallet?.adapter.publicKey ? (
                    0
                  ) : (
                    <span className="flex items-center justify-center text-center font-body text-sm text-th-fgd-3">
                      {t('connect-wallet')}
                    </span>
                  )
                ) : (
                  <SheenLoader>
                    <div className="h-8 w-32 rounded-md bg-th-bkg-3" />
                  </SheenLoader>
                )}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <p>Points Earned</p>
                <p className="font-mono text-th-fgd-2">
                  {!isLoadingWalletData ? (
                    walletRewardsData?.points ? (
                      formatNumericValue(walletRewardsData.points)
                    ) : wallet?.adapter.publicKey ? (
                      0
                    ) : (
                      '–'
                    )
                  ) : (
                    <SheenLoader>
                      <div className="h-4 w-12 rounded-sm bg-th-bkg-3" />
                    </SheenLoader>
                  )}
                </p>
              </div>
              <div className="flex justify-between">
                <p>Streak Bonus</p>
                <p className="font-mono text-th-fgd-2">0x</p>
              </div>
              <div className="flex justify-between">
                <p>Rewards Tier</p>
                <p className="text-th-fgd-2">
                  {!isLoadingWalletData ? (
                    walletRewardsData?.tier ? (
                      <span className="capitalize">
                        {walletRewardsData.tier}
                      </span>
                    ) : (
                      '–'
                    )
                  ) : (
                    <SheenLoader>
                      <div className="h-4 w-12 rounded-sm bg-th-bkg-3" />
                    </SheenLoader>
                  )}
                </p>
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
              <Select
                value={t(`rewards:${topAccountsTier}`)}
                onChange={(tier) => setTopAccountsTier(tier)}
              >
                {tiers.map((tier) => (
                  <Select.Option key={tier} value={tier}>
                    <div className="flex w-full items-center justify-between">
                      {t(`rewards:${tier}`)}
                    </div>
                  </Select.Option>
                ))}
              </Select>
            </div>
            <div className="border-b border-th-bkg-3">
              {!isLoadingLeaderboardData ? (
                topAccountsLeaderboardData &&
                topAccountsLeaderboardData.length ? (
                  topAccountsLeaderboardData
                    .slice(0, 5)
                    .map((wallet: RewardsLeaderboardItem, i: number) => (
                      <div
                        className="flex items-center justify-between border-t border-th-bkg-3 p-3"
                        key={i + wallet.wallet_pk}
                      >
                        <div className="flex items-center space-x-2 font-mono">
                          <span>{i + 1}.</span>
                          <span className="text-th-fgd-3">
                            {abbreviateAddress(new PublicKey(wallet.wallet_pk))}
                          </span>
                        </div>
                        <span className="font-mono text-th-fgd-1">
                          {formatNumericValue(wallet.points, 0)}
                        </span>
                      </div>
                    ))
                ) : (
                  <div className="flex justify-center border-t border-th-bkg-3 py-4">
                    <span className="text-th-fgd-3">
                      Leaderboard not available
                    </span>
                  </div>
                )
              ) : (
                <div className="space-y-0.5">
                  {[...Array(5)].map((x, i) => (
                    <SheenLoader className="flex flex-1" key={i}>
                      <div className="h-10 w-full bg-th-bkg-2" />
                    </SheenLoader>
                  ))}
                </div>
              )}
            </div>
            <Button
              className="mt-6 w-full"
              onClick={() => showLeaderboard(topAccountsTier)}
              secondary
            >
              Full Leaderboard
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

const Claim = () => {
  const [showWinModal, setShowWinModal] = useState(false)
  const [showLossModal, setShowLossModal] = useState(false)
  return (
    <>
      <div className="flex items-center justify-center bg-th-bkg-3 px-4 py-3">
        <ClockIcon className="mr-2 h-5 w-5 text-th-active" />
        <p className="text-base text-th-fgd-2">
          Season 1 claim ends in:{' '}
          <span className="font-bold text-th-fgd-1">24 hours</span>
        </p>
      </div>
      <div className="mx-auto grid max-w-[1140px] grid-cols-12 gap-4 p-8 lg:gap-6 lg:p-10">
        <div className="col-span-12">
          <div className="mb-6 text-center md:mb-12">
            <h2 className="mb-2 text-5xl">Congratulations!</h2>
            <p className="text-lg">You earnt 3 boxes in Season 1</p>
          </div>
          <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-center md:space-x-6 md:space-y-0">
            <div className="flex w-full flex-col items-center rounded-lg border border-th-bkg-3 p-6 md:w-1/3">
              <Image
                className="md:-mt-10"
                src="/images/rewards/cube.png"
                width={140}
                height={140}
                alt="Reward"
                style={{ width: 'auto', maxWidth: '140px' }}
              />
              <Button className="mt-8" size="large">
                Open Box
              </Button>
            </div>
            <div className="flex w-full flex-col items-center rounded-lg border border-th-bkg-3 p-6 md:w-1/3">
              <Image
                className="md:-mt-10"
                src="/images/rewards/cube.png"
                width={140}
                height={140}
                alt="Reward"
                style={{ width: 'auto', maxWidth: '140px' }}
              />
              <Button
                className="mt-8"
                size="large"
                onClick={() => setShowLossModal(true)}
              >
                Open Box
              </Button>
            </div>
            <div className="flex w-full flex-col items-center rounded-lg border border-th-bkg-3 p-6 md:w-1/3">
              <Image
                className="md:-mt-10"
                src="/images/rewards/cube.png"
                width={140}
                height={140}
                alt="Reward"
                style={{ width: 'auto', maxWidth: '140px' }}
              />
              <Button
                className="mt-8"
                onClick={() => setShowWinModal(true)}
                size="large"
              >
                Open Box
              </Button>
            </div>
          </div>
        </div>
      </div>
      {showWinModal ? (
        <ClaimWinModal
          isOpen={showWinModal}
          onClose={() => setShowWinModal(false)}
        />
      ) : null}
      {showLossModal ? (
        <ClaimLossModal
          isOpen={showLossModal}
          onClose={() => setShowLossModal(false)}
        />
      ) : null}
    </>
  )
}

const RewardsTierCard = ({
  desc,
  icon,
  name,
  showLeaderboard,
  status,
}: {
  desc: string
  icon: ReactNode
  name: string
  showLeaderboard: (x: string) => void
  status?: string
}) => {
  const { t } = useTranslation('rewards')
  return (
    <button
      className="w-full rounded-lg bg-th-bkg-2 p-4 text-left focus:outline-none md:hover:bg-th-bkg-3"
      onClick={() => showLeaderboard(name)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="mr-4 flex h-14 w-14 items-center justify-center rounded-full bg-th-bkg-1">
            {icon}
          </div>
          <div>
            <h3>{t(name)}</h3>
            <p>{desc}</p>
          </div>
        </div>
        <div className="flex items-center pl-4">
          {status ? (
            <Badge
              label={status}
              borderColor="var(--success)"
              shadowColor="var(--success)"
            />
          ) : null}
          <ChevronRightIcon className="ml-4 h-6 w-6 text-th-fgd-3" />
        </div>
      </div>
    </button>
  )
}

export const Badge = ({
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

const particleOptions = {
  detectRetina: true,
  emitters: {
    life: {
      count: 60,
      delay: 0,
      duration: 0.1,
    },
    startCount: 0,
    particles: {
      shape: {
        type: ['character', 'character', 'character', 'character', 'character'],
        options: {
          character: [
            {
              fill: true,
              font: 'Verdana',
              value: ['🍀', '🦄', '⭐️', '🎉', '💸'],
              style: '',
              weight: 400,
            },
          ],
        },
      },
      opacity: {
        value: 1,
      },
      rotate: {
        value: {
          min: 0,
          max: 360,
        },
        direction: 'random',
        animation: {
          enable: true,
          speed: 30,
        },
      },
      tilt: {
        direction: 'random',
        enable: true,
        value: {
          min: 0,
          max: 360,
        },
        animation: {
          enable: true,
          speed: 30,
        },
      },
      size: {
        value: 16,
      },
      roll: {
        darken: {
          enable: true,
          value: 25,
        },
        enable: true,
        speed: {
          min: 5,
          max: 15,
        },
      },
      move: {
        angle: 10,
        attract: {
          rotate: {
            x: 600,
            y: 1200,
          },
        },
        direction: 'bottom',
        enable: true,
        speed: { min: 8, max: 16 },
        outMode: 'destroy',
      },
    },
    position: {
      x: { random: true },
      y: 0,
    },
  },
}

const ClaimWinModal = ({ isOpen, onClose }: ModalProps) => {
  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="mb-6 text-center">
          <h2 className="mb-6">You&apos;re a winner!</h2>
          <div
            className="mx-auto mb-3 h-48 w-48 rounded-lg border border-th-success"
            style={{
              boxShadow: '0px 0px 8px 0px var(--success)',
            }}
          ></div>
          <p className="text-lg">Prize name goes here</p>
        </div>
        <Button className="w-full" size="large">
          Claim Prize
        </Button>
      </Modal>
      <div className="relative z-50">
        <Particles id="tsparticles" options={particleOptions} />
      </div>
    </>
  )
}

const ClaimLossModal = ({ isOpen, onClose }: ModalProps) => {
  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="mb-6 text-center">
          <h2 className="mb-2">Better luck next time</h2>
          <p className="text-lg">This box is empty</p>
        </div>
        <Button className="w-full" onClick={onClose} size="large">
          Close
        </Button>
      </Modal>
    </>
  )
}

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

const WhitelistWalletModal = ({ isOpen, onClose }: ModalProps) => {
  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="mb-6 text-center">
          <h2 className="mb-2">Whitelist Wallet</h2>
          <p className="text-lg">
            Wallets are required to be verified with your Discord account to
            participate in Mango Mints. We are doing this as a sybil prevention
            mechanism.
          </p>
        </div>
        <Button className="w-full" onClick={onClose} size="large">
          Whitelist Wallet
        </Button>
      </Modal>
    </>
  )
}
