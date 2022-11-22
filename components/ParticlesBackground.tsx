import Particles from 'react-tsparticles'

const ParticlesBackground = () => {
  return (
    <Particles
      id="tsparticles"
      options={{
        fullScreen: false,
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
          opacity: {
            value: 0,
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
                      width: 48,
                      height: 48,
                    },
                    {
                      src: '/icons/btc.svg',
                      width: 48,
                      height: 48,
                    },
                    {
                      src: '/icons/eth.svg',
                      width: 48,
                      height: 48,
                    },
                    {
                      src: '/icons/sol.svg',
                      width: 48,
                      height: 48,
                    },
                    {
                      src: '/icons/usdc.svg',
                      width: 48,
                      height: 48,
                    },
                    {
                      src: '/icons/usdt.svg',
                      width: 48,
                      height: 48,
                    },
                    {
                      src: '/icons/msol.svg',
                      width: 48,
                      height: 48,
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
                value: 24,
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
