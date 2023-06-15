import { PerpMarket, Serum3Market } from '@blockworks-foundation/mango-v4'
import { INITIAL_ANIMATION_SETTINGS } from '@components/settings/AnimationSettings'
import mangoStore from '@store/mangoStore'
import useJupiterMints from 'hooks/useJupiterMints'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { useEffect, useMemo } from 'react'
import Particles from 'react-tsparticles'
import { ANIMATION_SETTINGS_KEY } from 'utils/constants'

const SuccessParticles = () => {
  const { mangoTokens } = useJupiterMints()
  const showForSwap = mangoStore((s) => s.successAnimation.swap)
  const showForTrade = mangoStore((s) => s.successAnimation.trade)
  const tradeType = mangoStore((s) => s.tradeForm.tradeType)
  const set = mangoStore((s) => s.set)
  const [animationSettings] = useLocalStorageState(
    ANIMATION_SETTINGS_KEY,
    INITIAL_ANIMATION_SETTINGS
  )

  const tokenLogo = useMemo(() => {
    if (!mangoTokens.length) return ''
    if (showForSwap) {
      const tokenMint = mangoStore.getState().swap.outputBank?.mint.toString()
      return mangoTokens.find((t) => t.address === tokenMint)?.logoURI
    }
    if (showForTrade && tradeType === 'market') {
      const market = mangoStore.getState().selectedMarket.current
      const side = mangoStore.getState().tradeForm.side
      if (market instanceof Serum3Market) {
        const symbol =
          side === 'buy' ? market.name.split('/')[0] : market.name.split('/')[1]
        return mangoTokens.find((t) => t.symbol.toUpperCase() === symbol)
          ?.logoURI
      }
      if (market instanceof PerpMarket) {
        const symbol = side === 'buy' ? market.name.split('-')[0] : 'USDC'
        return (
          mangoTokens.find((t) => t.symbol.toUpperCase() === symbol)?.logoURI ||
          `/icons/${symbol.toLowerCase()}.svg`
        )
      }
    }
  }, [mangoTokens, showForSwap, showForTrade])

  useEffect(() => {
    if (showForSwap) {
      setTimeout(
        () =>
          set((s) => {
            s.successAnimation.swap = false
          }),
        8000
      )
    }
    if (showForTrade) {
      setTimeout(
        () =>
          set((s) => {
            s.successAnimation.trade = false
          }),
        8000
      )
    }
  }, [showForSwap, showForTrade])

  return animationSettings['swap-success'] &&
    tokenLogo &&
    (showForSwap || showForTrade) ? (
    <Particles
      id="tsparticles"
      options={{
        detectRetina: true,
        particles: {
          opacity: {
            value: 0,
          },
        },
        emitters: {
          life: {
            count: 30,
            delay: 0,
            duration: 0.1,
          },
          startCount: 0,
          particles: {
            shape: {
              type: 'image',
              options: {
                image: {
                  src: tokenLogo,
                  width: 48,
                  height: 48,
                },
              },
            },
            rotate: {
              value: 0,
              random: true,
              direction: 'clockwise',
              animation: {
                enable: true,
                speed: 15,
                sync: false,
              },
            },
            opacity: {
              value: 1,
            },
            size: {
              value: 20,
              random: false,
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
      }}
    />
  ) : null
}

export default SuccessParticles
