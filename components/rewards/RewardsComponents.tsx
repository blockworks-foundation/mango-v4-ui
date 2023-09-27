import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react'
import { Lalezar } from 'next/font/google'
const lalezar = Lalezar({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
})
import { init, onClick } from '../../lib/render'
import { Claim } from '@blockworks-foundation/mango-mints-redemption'
import { Token } from 'types/jupiter'
import BigNumber from 'bignumber.js'

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
}: {
  setShowRender: Dispatch<SetStateAction<boolean>>
  claims: Claim[]
  tokensInfo: Token[]
}) {
  const renderLoaded = useRef<boolean>(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [collectedPrizes, setCollectedPrize] = useState([] as any[])
  const [muted, setMuted] = useState(true)
  const [prizes, setPrizes] = useState<Prize[]>([])

  const [currentPrize, setCurrentPrize] = useState()

  useEffect(() => {
    if (!renderLoaded.current && prizes.length) {
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
  }, [prizes])

  useEffect(() => {
    const claimsAsPrizes: Prize[] = claims.map((x) => {
      const tokenInfo =
        x.mintProperties.type === 'token'
          ? tokensInfo.find((t) => t.address === x.mint.toBase58())
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
          x.mintProperties.type === 'token'
            ? new BigNumber(x.quantity.toString())
                .shiftedBy(-tokenInfo!.decimals)
                .toString()
            : x.quantity.toString(),
        rarity: x.mintProperties.rarity,
        itemResolution: resultion,
        itemUrl: tokenInfo?.logoURI || '/icons/mngo.svg',
        ...materials[
          x.mintProperties.rarity as 'Rare' | 'Legendary' | 'Common'
        ],
      }
    })
    setPrizes(claimsAsPrizes)
  }, [claims])

  useEffect(() => {
    setTimeout(() => {
      setMuted(false)
    }, 0)
  }, [prizes])

  return (
    <main className="from-midnight-sky to-midnight-horizon static h-screen w-screen bg-black bg-gradient-to-b">
      <div className="absolute left-[80px] top-0 pl-4">
        <div
          className="fixed right-0 top-0 text-right text-white"
          onClick={() => {
            setShowRender(false)
          }}
        >
          Close
        </div>
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
            {/* common: text-sky-300
            rare: text-yellow-300
            legendary: text-orange-400 */}
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
      <div id="render-output" onClick={onClick}></div>
      <video
        className="hidden"
        id="particles-coins"
        preload="true"
        playsInline
        muted={muted}
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
        muted={muted}
      >
        <source
          src="/particles/fireworks_2k_hvc1.mov"
          type="video/mp4;codecs=hvc1"
        />
        <source src="/particles/fireworks_2k_vp9.webm" type="video/webm" />
      </video>
    </main>
  )
}
