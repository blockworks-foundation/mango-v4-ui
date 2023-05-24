const ColorBlur = ({
  className,
  height,
  width,
}: {
  className?: string
  height: string
  width: string
}) => {
  return (
    <div
      className={`absolute rounded-full blur-3xl filter ${className}`}
      style={{ height: height, width: width }}
    />
  )
}

export default ColorBlur
