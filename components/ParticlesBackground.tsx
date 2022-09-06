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
        emitters: {
          autoPlay: true,
          life: {
            wait: false,
          },
          rate: {
            quantity: 1,
            delay: 8,
          },
          particles: {
            opacity: {
              value: 100,
            },
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
                ],
              },
            },
            size: {
              value: 16,
            },
            move: {
              speed: 3,
              straight: true,
            },
            zIndex: {
              value: 0,
            },
            rotate: {
              value: {
                min: 0,
                max: 360,
              },
              animation: {
                enable: true,
                speed: 10,
                sync: true,
              },
            },
          },
          position: {
            x: -5,
            y: -5,
          },
        },
      }}
    />
  )
}

export default ParticlesBackground
