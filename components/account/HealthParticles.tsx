import { useCallback } from 'react'
import Particles from 'react-tsparticles'
import { loadFull } from 'tsparticles'

const HealthParticles = ({
  numberOfParticles,
}: {
  numberOfParticles: number
}) => {
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
      id="health-particles"
      init={particlesInit}
      loaded={particlesLoaded}
      options={{
        fullScreen: { enable: false },
        interactivity: {
          detect_on: 'canvas',
          events: {
            onHover: {
              enable: true,
              mode: 'attract',
            },
          },
          modes: {
            attract: {
              distance: 40,
              duration: 0.4,
              easing: 'ease-out-quad',
              factor: 2,
              maxSpeed: 2,
              speed: 1,
            },
          },
        },
        particles: {
          opacity: {
            animation: {
              enable: true,
              minimumValue: 0.8,
              speed: 1,
              sync: false,
            },
            random: false,
            value: 1,
          },
          move: {
            gravity: {
              enable: true,
              acceleration: 3,
              maxSpeed: 1,
            },
            enable: true,
            outModes: {
              default: 'none',
              bottom: 'bounce',
              left: 'bounce',
              right: 'bounce',
              top: 'bounce',
            },
            speed: 0.1,
          },
          number: {
            value: numberOfParticles ? Math.ceil(numberOfParticles / 2) : 1,
          },
          shape: {
            options: {
              character: {
                fill: true,
                font: 'Verdana',
                value: numberOfParticles
                  ? numberOfParticles > 15 && numberOfParticles < 50
                    ? '🧡'
                    : numberOfParticles >= 50
                    ? '💚'
                    : '💔'
                  : '💀',
                style: '',
                weight: 400,
              },
            },
            type: 'char',
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
            value: 8,
          },
        },
      }}
    />
  )
}

export default HealthParticles
