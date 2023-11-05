type CircularProgressProps = {
  className?: string
  size: number
  progress: number
  trackWidth: number
  indicatorWidth: number
}

const CircularProgress = ({
  className,
  indicatorWidth,
  progress,
  size,
  trackWidth,
}: CircularProgressProps) => {
  const center = size / 2,
    radius =
      center - (trackWidth > indicatorWidth ? trackWidth : indicatorWidth),
    dashArray = 2 * Math.PI * radius,
    dashOffset = dashArray * ((100 - progress) / 100)

  return (
    <>
      <div
        className={`relative ${className}`}
        style={{ width: size, height: size }}
      >
        <svg
          className="-rotate-90 fill-transparent stroke-th-fgd-4"
          style={{ width: size, height: size }}
        >
          <circle cx={center} cy={center} r={radius} strokeWidth={trackWidth} />
          <circle
            className="fill-transparent stroke-th-active"
            cx={center}
            cy={center}
            r={radius}
            strokeDasharray={dashArray}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            strokeWidth={indicatorWidth}
          />
        </svg>
      </div>
    </>
  )
}

export default CircularProgress
