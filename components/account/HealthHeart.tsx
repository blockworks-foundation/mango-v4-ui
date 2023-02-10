import { useMemo } from 'react'

const HealthHeart = ({ health, size }: { health: number; size: number }) => {
  const fillColor = useMemo(() => {
    if (!health) return 'var(--fgd-4)'
    if (health <= 25) {
      return 'var(--down)'
    }
    if (health <= 50) {
      return 'var(--warning)'
    }
    if (health <= 75) {
      return 'var(--up)'
    }
    return 'var(--up)'
  }, [health])

  const styles = {
    color: fillColor,
    // filter: `drop-shadow(0px 0px 8px ${fillColor})`,
    height: `${size}px`,
    width: `${size}px`,
  }

  return (
    <svg
      className={health && health < 10 ? 'animate-pulse' : ''}
      id="account-step-eleven"
      xmlns="http://www.w3.org/2000/svg"
      style={styles}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <g transform-origin="center">
        <path
          fillRule="evenodd"
          d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
          clipRule="evenodd"
        />
        {/* <animateTransform
          attributeName="transform"
          type="scale"
          keyTimes="0;0.5;1"
          values="1;1.1;1"
          dur={
            health
              ? health > 15 && health < 50
                ? '1s'
                : health >= 50
                ? '2s'
                : '0.33s'
              : '0s'
          }
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.8;1;0.8"
          dur={
            health
              ? health > 15 && health < 50
                ? '1s'
                : health >= 50
                ? '2s'
                : '0.33s'
              : '0s'
          }
          repeatCount="indefinite"
        /> */}
      </g>
    </svg>
  )
}

export default HealthHeart
