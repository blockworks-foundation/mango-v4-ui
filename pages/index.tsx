import type { NextPage } from 'next'

import Home from '../components/Home'
import Container from '../components/shared/Container'
import TopBar from '../components/TopBar'

const Index: NextPage = () => {
  return (
    <Container>
      <TopBar />

      <Home />
    </Container>
  )
}

export default Index
