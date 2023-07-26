import { useEffect, useState } from 'react'
import isNetworkSlow from 'utils/network'

export default function useNetworkSpeed() {
  const [slowNetwork, setSlowNetwork] = useState(true)

  useEffect(() => {
    setSlowNetwork(isNetworkSlow())
  }, [])

  return slowNetwork
}
