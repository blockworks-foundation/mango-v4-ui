import { useMemo } from 'react'

const HealthBar = ({ health }: { health: number }) => {
  const [barWidths, fillColor] = useMemo(() => {
    if (!health) return [[2, 0, 0, 0], 'var(--down)']
    if (health <= 25) {
      const fillWidth = (health / 25) * 100
      return [[fillWidth, 0, 0, 0], 'var(--down)']
    }
    if (health <= 50) {
      const fillWidth = ((health - 25) / 25) * 100
      return [[100, fillWidth, 0, 0], 'var(--warning)']
    }
    if (health <= 75) {
      const fillWidth = ((health - 50) / 25) * 100
      return [[100, 100, fillWidth, 0], 'var(--up)']
    }
    const fillWidth = ((health - 75) / 25) * 100
    return [[100, 100, 100, fillWidth], 'var(--up)']
  }, [health])

  const sharedStyles = {
    background: fillColor,
    boxShadow: `0px 0px 8px 0px ${fillColor}`,
  }

  return (
    <div className="grid w-full grid-cols-4 gap-1">
      <div className="col-span-1 flex h-1 rounded-full bg-th-bkg-3">
        <div
          style={{
            ...sharedStyles,
            width: `${barWidths[0]}%`,
          }}
          className={`flex rounded-full`}
        />
      </div>
      <div className="col-span-1 flex h-1 rounded-full bg-th-bkg-3">
        <div
          style={{
            ...sharedStyles,
            width: `${barWidths[1]}%`,
          }}
          className={`flex rounded-full`}
        />
      </div>
      <div className="col-span-1 flex h-1 rounded-full bg-th-bkg-3">
        <div
          style={{
            ...sharedStyles,
            width: `${barWidths[2]}%`,
          }}
          className={`flex rounded-full`}
        />
      </div>
      <div className="col-span-1 flex h-1 rounded-full bg-th-bkg-3">
        <div
          style={{
            ...sharedStyles,
            width: `${barWidths[3]}%`,
          }}
          className={`flex rounded-full`}
        />
      </div>
    </div>
  )
}

export default HealthBar
