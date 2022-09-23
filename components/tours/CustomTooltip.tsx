import Loading from '@components/shared/Loading'
import { XMarkIcon } from '@heroicons/react/20/solid'
import { useWallet } from '@solana/wallet-adapter-react'
import mangoStore from '@store/mangoStore'
import { useState } from 'react'
import { WalktourLogic } from 'walktour'

const CustomTooltip = ({
  customOnClose,
  hasSeenKey,
  tourLogic,
}: {
  customOnClose?: () => void
  hasSeenKey: 'account_tour_seen' | 'swap_tour_seen' | 'trade_tour_seen'
  tourLogic: WalktourLogic | undefined
}) => {
  const { title, description } = tourLogic!.stepContent
  const { next, prev, close, allSteps, stepIndex } = tourLogic!
  const { publicKey } = useWallet()
  const actions = mangoStore((s) => s.actions)
  const tourSettings = mangoStore((s) => s.settings.tours)
  const [loading, setLoading] = useState(false)

  const onClose = async () => {
    if (!publicKey || !tourSettings) return
    setLoading(true)
    try {
      const settings = {
        ...tourSettings,
      }
      settings[hasSeenKey] = true
      const message = JSON.stringify(settings)
      const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: message,
      }
      const response = await fetch(
        'https://mango-transaction-log.herokuapp.com/v4/user-data/settings-unsigned',
        requestOptions
      )
      if (response.status === 200) {
        await actions.fetchTourSettings(publicKey.toString())
      }
    } catch (e) {
      console.log(e)
    } finally {
      if (customOnClose) {
        customOnClose()
      }
      setLoading(false)
      close()
    }
  }

  return (
    <div className="relative w-72 rounded-lg bg-gradient-to-b from-gradient-start via-gradient-mid to-gradient-end p-4">
      {!loading ? (
        <>
          <button
            onClick={onClose}
            className={`absolute right-4 top-4 z-50 text-th-bkg-3 focus:outline-none md:right-2 md:top-2 md:hover:text-th-primary`}
          >
            <XMarkIcon className={`h-5 w-5`} />
          </button>
          <h3 className="text-th-bkg-1">{title}</h3>
          <p className="text-sm text-th-bkg-1">{description}</p>
          <div className="mt-4 flex items-center justify-between">
            {stepIndex !== 0 ? (
              <button
                className="default-transition h-8 rounded-md border border-th-bkg-1 px-3 font-bold text-th-bkg-1 focus:outline-none md:hover:border-th-bkg-3 md:hover:text-th-bkg-3"
                onClick={() => prev()}
              >
                Back
              </button>
            ) : (
              <div className="h-8 w-[58.25px]" />
            )}
            <div className="flex space-x-1.5">
              {allSteps.map((s, i) => (
                <div
                  className={`h-1 w-1 rounded-full ${
                    i === stepIndex ? 'bg-th-primary' : 'bg-[rgba(0,0,0,0.2)]'
                  }`}
                  key={s.title}
                />
              ))}
            </div>
            {stepIndex !== allSteps.length - 1 ? (
              <button
                className="default-transition h-8 rounded-md bg-th-bkg-1 px-3 font-bold text-th-fgd-1 focus:outline-none md:hover:bg-th-bkg-3"
                onClick={() => next()}
              >
                Next
              </button>
            ) : (
              <button
                className="default-transition h-8 rounded-md bg-th-bkg-1 px-3 font-bold text-th-fgd-1 focus:outline-none md:hover:bg-th-bkg-3"
                onClick={onClose}
              >
                Finish
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="flex h-full items-center justify-center py-12">
          <Loading />
        </div>
      )}
    </div>
  )
}

export default CustomTooltip
