type ContainerProps = {
  children: React.ReactNode
}

const Container = ({ children }: ContainerProps) => {
  return (
    <div className="min-h-screen bg-mango-800 text-mango-100 ">{children}</div>
  )
}

export default Container
