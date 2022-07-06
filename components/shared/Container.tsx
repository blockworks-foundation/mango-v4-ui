type ContainerProps = {
  children: React.ReactNode
}

const Container = ({ children }: ContainerProps) => {
  return (
    <div className="min-h-screen bg-th-bkg-1 text-th-fgd-1 ">{children}</div>
  )
}

export default Container
