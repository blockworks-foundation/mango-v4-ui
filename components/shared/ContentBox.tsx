type ContentBoxProps = {
  children: React.ReactNode
}

const ContentBox = ({ children }: ContentBoxProps) => {
  return <div className="rounded-xl bg-mango-700 p-8">{children}</div>
}

export default ContentBox
