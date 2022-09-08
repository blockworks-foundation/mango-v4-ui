import { useCallback } from 'react'
import Particles from 'react-tsparticles'
import { loadFull } from 'tsparticles'

const ParticlesBackground = () => {
  const particlesInit = useCallback(async (engine: any) => {
    console.log(engine)

    // you can initialize the tsParticles instance (engine) here, adding custom shapes or presets
    // this loads the tsparticles package bundle, it's the easiest method for getting everything ready
    // starting from v2 you can add only the features you need reducing the bundle size
    await loadFull(engine)
  }, [])

  const particlesLoaded = useCallback(async (container: any) => {
    await console.log(container)
  }, [])

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      loaded={particlesLoaded}
      options={{
        interactivity: {
          detect_on: 'canvas',
          events: {
            onDiv: {
              selectors: '#repulse',
              enable: true,
              mode: 'repulse',
            },
            onHover: {
              enable: true,
              mode: 'attract',
            },
            resize: true,
          },
        },
        particles: {
          groups: {
            z5000: {
              number: {
                value: 70,
              },
              zIndex: {
                value: 50,
              },
            },
            z7500: {
              number: {
                value: 30,
              },
              zIndex: {
                value: 75,
              },
            },
            z2500: {
              number: {
                value: 50,
              },
              zIndex: {
                value: 25,
              },
            },
            z1000: {
              number: {
                value: 40,
              },
              zIndex: {
                value: 10,
              },
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
            direction: 'right',
            enable: true,
            speed: 1,
          },
        },
        emitters: [
          {
            autoPlay: true,
            fill: true,
            life: {
              wait: false,
              delay: 0.5,
              duration: 1,
            },
            rate: {
              quantity: 1,
              delay: { min: 3, max: 12 },
            },
            startCount: 0,
            particles: {
              shape: {
                type: 'images',
                options: {
                  images: [
                    {
                      src: '/icons/mngo.svg',
                      width: 32,
                      height: 32,
                    },
                    {
                      src: '/icons/btc.svg',
                      width: 32,
                      height: 32,
                    },
                    {
                      src: '/icons/eth.svg',
                      width: 32,
                      height: 32,
                    },
                    {
                      src: '/icons/sol.svg',
                      width: 32,
                      height: 32,
                    },
                    {
                      src: '/icons/usdc.svg',
                      width: 32,
                      height: 32,
                    },
                    {
                      src: '/icons/usdt.svg',
                      width: 32,
                      height: 32,
                    },
                    {
                      src: '/icons/msol.svg',
                      width: 32,
                      height: 32,
                    },
                  ],
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
              lineLinked: {
                enable: false,
              },
              opacity: {
                value: 1,
              },
              size: {
                value: 16,
                random: false,
              },
              move: {
                speed: 3,
                random: false,
                outMode: 'destroy',
              },
            },
            position: {
              x: 0,
            },
          },
        ],
      }}
    />
  )
}

export default ParticlesBackground
