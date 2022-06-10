import type { NextPage } from 'next'

import Home from '../components/Home'
import TopBar from '../components/TopBar'

const Index: NextPage = () => {
  return (
    <div className="min-h-screen bg-mango-800 text-mango-100 ">
      <TopBar />

      <Home />
    </div>
  )
}

export default Index
