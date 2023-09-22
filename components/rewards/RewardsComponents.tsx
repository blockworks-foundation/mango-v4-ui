import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react'
import { Lalezar } from 'next/font/google'

const lalezar = Lalezar({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
})

import { init, onClick } from '../../lib/render'

const prizes = [
  {
    item: 'MNGO',
    info: '10,000',
    rarity: 'Rare',
    itemResolution: [32, 32],
    itemUrl: '/models/tex_procedural/tokens/mngo.svg',
    particleId: 'particles-coins',
    stencilUrl: '/models/tex_procedural/tex_card_front_gold_circle_albedo.png',
    frontMaterialId: 'loader_mat_card_gold_front_circle',
    backMaterialId: 'loader_mat_card_gold_back',
  },
  {
    item: 'Pepe Skin',
    info: '#1337',
    rarity: 'Rare',
    itemResolution: [440, 440],
    itemUrl: '/skins/pepe_skin_demo.jpg',
    particleId: 'particles-fireworks',
    stencilUrl:
      '/models/tex_procedural/tex_card_front_silver_square_albedo.png',
    frontMaterialId: 'loader_mat_card_silver_front_square',
    backMaterialId: 'loader_mat_card_silver_back',
  },
  {
    item: 'BONK',
    info: '21,000,000',
    rarity: 'Common',
    itemResolution: [32, 32],
    itemUrl: '/models/tex_procedural/tokens/bonk.svg',
    particleId: 'particles-coins',
    stencilUrl: '/models/tex_procedural/tex_card_front_slver_albedo.png',
    frontMaterialId: 'loader_mat_card_silver_front',
    backMaterialId: 'loader_mat_card_silver_back',
  },
  {
    item: 'Monke',
    info: '#2345',
    rarity: 'Legendary',
    itemResolution: [384, 384],
    itemUrl:
      'https://gg6o4oqyfo22emifd25zpqp5iguyak7wjohheprzwxcqniztexqq.arweave.net/MbzuOhgrtaIxBR67l8H9QamAK_ZLjnI-ObXFBqMzJeE',
    particleId: 'particles-fireworks',
    stencilUrl: '/models/tex_procedural/tex_card_front_gold_albedo.png',
    frontMaterialId: 'loader_mat_card_gold_front',
    backMaterialId: 'loader_mat_card_gold_back',
  },
]

export default function RewardsComponent({
  setHide,
}: {
  setHide: Dispatch<SetStateAction<boolean>>
}) {
  const renderLoaded = useRef<boolean>(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [collectedPrizes, setCollectedPrize] = useState([] as any[])
  const [muted, setMuted] = useState(true)

  const [currentPrize, setCurrentPrize] = useState()

  // TODO: make sure to set .mute=false on each video element on the first ui
  //       interaction, e.g. when clicking a start button or something like that
  useEffect(() => {
    if (!renderLoaded.current) {
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
    }
  }, [])

  useEffect(() => {
    setTimeout(() => {
      setMuted(false)
    }, 0)
  }, [])

  return (
    <main className="from-midnight-sky to-midnight-horizon static h-screen w-screen bg-black bg-gradient-to-b">
      <div className="absolute left-[80px] top-0 pl-4">
        <div
          className="fixed right-0 top-0 text-right text-white"
          onClick={() => setHide(false)}
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
