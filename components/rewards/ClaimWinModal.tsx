import Button from '@components/shared/Button'
import Modal from '@components/shared/Modal'
import Particles from 'react-tsparticles'
import { ModalProps } from 'types/modal'

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

export default ClaimWinModal
