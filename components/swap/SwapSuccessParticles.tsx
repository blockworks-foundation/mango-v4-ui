import mangoStore from '@store/mangoStore'
import useJupiterMints from 'hooks/useJupiterMints'
import { useEffect, useMemo } from 'react'
import Particles from 'react-tsparticles'

const SwapSuccessParticles = () => {
  const { mangoTokens } = useJupiterMints()
  const showSwapAnimation = mangoStore((s) => s.swap.success)
  const swapTokenMint = mangoStore((s) => s.swap.outputBank)?.mint.toString()
  const set = mangoStore((s) => s.set)

  const tokenLogo = useMemo(() => {
    if (!mangoTokens.length || !swapTokenMint) return ''
    const token = mangoTokens.find((t) => t.address === swapTokenMint)
    return token?.logoURI ? token.logoURI : ''
  }, [mangoTokens, swapTokenMint])

  useEffect(() => {
    if (showSwapAnimation) {
      setTimeout(
        () =>
          set((s) => {
            s.swap.success = false
          }),
        8000
      )
    }
  }, [showSwapAnimation])

  return showSwapAnimation && tokenLogo ? (
    <Particles
      id="tsparticles"
      options={{
        autoPlay: true,
        detectRetina: true,
        duration: 3000,
        particles: {
          shape: {
            type: 'images',
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
          size: {
            value: 16,
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
            speed: { min: 7, max: 15 },
            outMode: 'destroy',
          },
          opacity: {
            value: 1,
          },
        },
      }}
    />
  ) : null
}

export default SwapSuccessParticles
