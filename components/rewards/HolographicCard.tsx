import React, { useRef, useEffect } from 'react'
import Image from 'next/image'

function HolographicCard() {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!cardRef.current) return

    const el = cardRef.current
    const handleMouseMove = (e: MouseEvent) => {
      const w = el.clientWidth
      const h = el.clientHeight
      const b = el.getBoundingClientRect()

      const X = (e.clientX - b.left) / w
      const Y = (e.clientY - b.top) / h

      const rX = -(X - 0.5) * 26
      const rY = (Y - 0.5) * 26

      const bgX = 40 + 20 * X
      const bgY = 40 + 20 * Y

      document.documentElement.style.setProperty('--x', 100 * X + '%')
      document.documentElement.style.setProperty('--y', 100 * Y + '%')

      document.documentElement.style.setProperty('--bg-x', bgX + '%')
      document.documentElement.style.setProperty('--bg-y', bgY + '%')

      document.documentElement.style.setProperty('--r-x', rX + 'deg')
      document.documentElement.style.setProperty('--r-y', rY + 'deg')
    }
    const handleMouseLeave = () => {
      // Resetting to neutral values
      document.documentElement.style.setProperty('--x', '50%')
      document.documentElement.style.setProperty('--y', '50%')
      document.documentElement.style.setProperty('--bg-x', '50%')
      document.documentElement.style.setProperty('--bg-y', '50%')
      document.documentElement.style.setProperty('--r-x', '0deg')
      document.documentElement.style.setProperty('--r-y', '0deg')
    }

    el.addEventListener('mousemove', handleMouseMove)
    el.addEventListener('mouseleave', handleMouseLeave)

    // Cleanup event listener on unmount
    return () => {
      el.removeEventListener('mousemove', handleMouseMove)
      el.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <div
      className="card scale-[.6] transition duration-150 hover:scale-[.65]"
      ref={cardRef}
    >
      <div className="card__wrapper">
        <div className="card__3d">
          <div className="card__image" style={{ cursor: 'pointer' }}>
            <div className="rounded-[48px] border-2 border-white/90 bg-gradient-to-bl from-yellow-300 to-yellow-500 p-4 shadow-xl">
              <Image
                src="/images/rewards/questionmark3.png"
                alt="Frame Legendary"
                width={600}
                height={600}
                className="rounded-[40px] opacity-40 shadow-md ring-2 ring-white/50"
              />
            </div>
          </div>
          <div className="card__layer1"></div>
          <div className="card__layergold"></div>
        </div>
      </div>
    </div>
  )
}

export default HolographicCard
