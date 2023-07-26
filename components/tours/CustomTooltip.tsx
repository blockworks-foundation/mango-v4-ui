import Loading from '@components/shared/Loading'
import { XMarkIcon } from '@heroicons/react/20/solid'
import { useWallet } from '@solana/wallet-adapter-react'
import mangoStore from '@store/mangoStore'
import { useState } from 'react'
import { MANGO_DATA_API_URL } from 'utils/constants'
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
  const actions = mangoStore.getState().actions
  const tourSettings = mangoStore((s) => s.settings.tours)
  const [loading, setLoading] = useState(false)

  const onClose = async () => {
    if (!publicKey) return
    if (tourSettings) {
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
          `${MANGO_DATA_API_URL}/user-data/settings-unsigned`,
          requestOptions,
        )
        if (response.status === 200) {
          await actions.fetchTourSettings(publicKey.toString())
        }
      } catch (e) {
        console.error(e)
      } finally {
        if (customOnClose) {
          customOnClose()
        }
        setLoading(false)
        close()
      }
    } else close()
  }

  return (
    <div className="relative w-72 rounded-lg bg-th-bkg-2 p-4">
      {!loading ? (
        <>
          <button
            onClick={onClose}
            className={`absolute right-4 top-4 z-40 text-th-fgd-4 focus:outline-none md:right-2 md:top-2 md:hover:text-th-active`}
          >
            <XMarkIcon className={`h-5 w-5`} />
          </button>
          <h3 className="mb-1 text-base text-th-fgd-1">{title}</h3>
          <p className="text-sm text-th-fgd-3">{description}</p>
          <div className="mt-4 flex items-center justify-between">
            {stepIndex !== 0 ? (
              <button
                className="h-8 rounded-md border border-th-fgd-4 px-3 font-bold text-th-fgd-3 focus:outline-none md:hover:border-th-fgd-3 md:hover:text-th-fgd-2"
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
                    i === stepIndex ? 'bg-th-active' : 'bg-th-bkg-4'
                  }`}
                  key={s.title}
                />
              ))}
            </div>
            {stepIndex !== allSteps.length - 1 ? (
              <button
                className="h-8 rounded-md bg-th-button px-3 font-bold text-th-fgd-1 focus:outline-none md:hover:bg-th-button-hover"
                onClick={() => next()}
              >
                Next
              </button>
            ) : (
              <button
                className="h-8 rounded-md bg-th-button px-3 font-bold text-th-fgd-1 focus:outline-none md:hover:bg-th-button-hover"
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
