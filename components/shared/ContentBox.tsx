type ContentBoxProps = {
  children: React.ReactNode
  className?: string
}

const ContentBox = ({ children, className = '' }: ContentBoxProps) => {
  return (
    <div className={`rounded-xl bg-th-bkg-2 p-8 ${className}`}>{children}</div>
  )
}

export default ContentBox
