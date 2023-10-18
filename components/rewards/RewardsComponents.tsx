import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { init, mute, onClick, unmute } from '../../lib/render'
import { Claim } from '@blockworks-foundation/mango-mints-redemption'
import { Token } from 'types/jupiter'
import BigNumber from 'bignumber.js'
import { IconButton } from '@components/shared/Button'
import { XMarkIcon } from '@heroicons/react/20/solid'
import useMangoGroup from 'hooks/useMangoGroup'
import { PublicKey } from '@solana/web3.js'
import { CUSTOM_TOKEN_ICONS } from 'utils/constants'
import { Sft, SftWithToken, Nft, NftWithToken } from '@metaplex-foundation/js'
import { Lalezar } from 'next/font/google'

const lalezar = Lalezar({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
})

type Prize = {
  //symbol
  item: string
  //amount
  info: string
  rarity: 'Rare' | 'Legendary' | 'Common'
  //eg [32, 32] token, nft [400,400]
  itemResolution: number[]
  itemUrl: string
  particleId: 'particles-coins' | 'particles-fireworks'
  stencilUrl:
    | '/models/tex_procedural/tex_card_front_gold_circle_albedo.png'
    | '/models/tex_procedural/tex_card_front_silver_square_albedo.png'
  frontMaterialId:
    | 'loader_mat_card_gold_front_circle'
    | 'loader_mat_card_silver_front_square'
  backMaterialId: 'loader_mat_card_gold_back' | 'loader_mat_card_silver_back'
}

export default function RewardsComponent({
  setShowRender,
  claims,
  tokensInfo,
  nftsRewardsInfo,
  start,
}: {
  setShowRender: Dispatch<SetStateAction<boolean>>
  claims: Claim[]
  tokensInfo: Token[]
  nftsRewardsInfo: (Sft | SftWithToken | Nft | NftWithToken)[]
  start: boolean
}) {
  const renderLoaded = useRef<boolean>(false)
  const { group } = useMangoGroup()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [collectedPrizes, setCollectedPrize] = useState([] as any[])
  const [prizes, setPrizes] = useState<Prize[]>([])

  const [currentPrize, setCurrentPrize] = useState()

  function iOS() {
    return (
      [
        'iPad Simulator',
        'iPhone Simulator',
        'iPod Simulator',
        'iPad',
        'iPhone',
        'iPod',
      ].includes(navigator.platform) ||
      // iPad on iOS 13 detection
      (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
    )
  }

  useEffect(() => {
    if (!renderLoaded.current && prizes.length && start) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const v1 = document.getElementById('particles-fireworks') as any
        v1.onloadedmetadata = () => (v1.currentTime = v1.duration)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const v2 = document.getElementById('particles-coins') as any
        v2.onloadedmetadata = () => (v2.currentTime = v2.duration)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        init(document, window, prizes, (prize: any) => {
          console.log('callback:showPrize', prize)
          setCurrentPrize(prize)
          collectedPrizes.push(prize)
          setCollectedPrize(collectedPrizes)

          setTimeout(() => {
            console.log('callback:hidePrize')
            setCurrentPrize(undefined)
          }, 5000)
        })
        renderLoaded.current = true
      } catch (e) {
        //if webgl is turned off or someone uses old computer
        console.log(e)
        setShowRender(false)
      }
    }
  }, [prizes, start])

  const getFallbackImg = useCallback(
    (mint: PublicKey, jupiterLogoUrl: string | undefined) => {
      const bank = group?.getFirstBankByMint(mint)
      const tokenSymbol = bank?.name.toLowerCase()
      const hasCustomIcon = tokenSymbol
        ? CUSTOM_TOKEN_ICONS[tokenSymbol]
        : false
      if (hasCustomIcon) {
        return `/icons/${tokenSymbol}.svg`
      } else {
        return jupiterLogoUrl || '/icons/mngo.svg'
      }
    },
    [group],
  )

  useEffect(() => {
    if (tokensInfo.length) {
      const claimsAsPrizes: Prize[] = claims.map((x) => {
        const tokenInfo =
          x.mintProperties.type === 'token'
            ? tokensInfo.find((t) => t.address === x.mint.toBase58())
            : null
        const nftInfo =
          x.mintProperties.type === 'nft'
            ? nftsRewardsInfo.find(
                (ni) => ni.address.toBase58() === x.mint.toBase58(),
              )
            : null
        const resultion =
          x.mintProperties.type === 'token' ? [32, 32] : [400, 400]

        const materials: {
          [key: string]: Omit<
            Prize,
            'item' | 'info' | 'rarity' | 'itemResolution' | 'itemUrl'
          >
        } = {
          Common: {
            particleId: 'particles-coins',
            frontMaterialId: 'loader_mat_card_silver_front_square',
            backMaterialId: 'loader_mat_card_silver_back',
            stencilUrl:
              '/models/tex_procedural/tex_card_front_silver_square_albedo.png',
          },
          Legendary: {
            particleId: 'particles-fireworks',
            frontMaterialId: 'loader_mat_card_gold_front_circle',
            backMaterialId: 'loader_mat_card_gold_back',
            stencilUrl:
              '/models/tex_procedural/tex_card_front_gold_circle_albedo.png',
          },
          Rare: {
            particleId: 'particles-fireworks',
            frontMaterialId: 'loader_mat_card_gold_front_circle',
            backMaterialId: 'loader_mat_card_gold_back',
            stencilUrl:
              '/models/tex_procedural/tex_card_front_gold_circle_albedo.png',
          },
        }

        return {
          item: x.mintProperties.name,
          info:
            x.mintProperties.type === 'token' && tokenInfo
              ? new BigNumber(x.quantity.toString())
                  .shiftedBy(-tokenInfo.decimals)
                  .toString()
              : x.quantity.toString(),
          rarity: x.mintProperties.rarity,
          itemResolution: resultion,
          //fallback of img from files if mint matches mango bank
          itemUrl:
            x.mintProperties.type === 'token'
              ? getFallbackImg(x.mint, tokenInfo?.logoURI)
              : nftInfo?.json?.image || '/icons/mngo.svg',
          ...materials[
            x.mintProperties.rarity as 'Rare' | 'Legendary' | 'Common'
          ],
        }
      })
      setPrizes(claimsAsPrizes)
    }
  }, [claims, getFallbackImg, tokensInfo])

  return (
    <main className="from-midnight-sky to-midnight-horizon static h-screen w-screen bg-black bg-gradient-to-b">
      {start && (
        <div className="absolute left-[80px] top-0 pl-4">
          <IconButton
            className="fixed right-4 top-4"
            onClick={() => {
              setShowRender(false)
              mute()
              document.getElementById('render-output')?.remove()
            }}
          >
            <XMarkIcon className="h-8 w-8 text-th-fgd-2" />
          </IconButton>
        </div>
      )}
      <div
        id="animation-component-loader"
        className="z-index-[1000] flex h-screen w-screen items-center justify-center text-white"
      >
        <div className="flex flex-row">
          <svg
            aria-hidden="true"
            className="mr-2 h-8 w-8 animate-spin fill-blue-600 text-gray-200 dark:text-gray-600"
            viewBox="0 0 100 101"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
              fill="currentColor"
            />
            <path
              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
              fill="currentFill"
            />
          </svg>
        </div>
      </div>
      <div className="absolute left-0 top-0 pl-4">
        <div className="my-2 flex flex-row gap-2">
          {collectedPrizes.map((p, i) => {
            return (
              // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
              <img key={i} className="h-24 rounded-lg" src={p.cardImgUrl} />
            )
          })}
        </div>
        {!!currentPrize && (
          <>
            <p className={`text-4xl text-white	${lalezar.className}`}>
              {currentPrize['item']}
            </p>
            <p className={`text-3xl text-yellow-300 ${lalezar.className}`}>
              {currentPrize['rarity']}
            </p>
            <p
              id="info-text"
              className={`text-3xl text-white	${lalezar.className}`}
            >
              {currentPrize['info']}
            </p>
          </>
        )}
      </div>
      <div
        id="render-output"
        onClick={() => {
          unmute()
          if (!iOS()) {
            onClick()
          }
        }}
      ></div>
      <video
        className="hidden"
        id="particles-coins"
        preload="true"
        playsInline
        muted
      >
        <source
          src="/particles/coins_2k_hvc1.mov"
          type="video/mp4;codecs=hvc1"
        />
        <source src="/particles/coins_2k_vp9.webm" type="video/webm" />
      </video>
      <video
        className="hidden"
        id="particles-fireworks"
        preload="true"
        playsInline
        muted
      >
        <source
          src="/particles/fireworks_2k_hvc1.mov"
          type="video/mp4;codecs=hvc1"
        />
        <source src="/particles/fireworks_2k_vp9.webm" type="video/webm" />
      </video>
      <audio className="hidden" id="animation" preload="true" playsInline muted>
        <source src="/sounds/animation.m4a" type="audio/mp4"></source>
        <source src="/sounds/animation.oga" type="audio/ogg"></source>
      </audio>
    </main>
  )
}
