import { XMarkIcon } from '@heroicons/react/20/solid'
import { WalktourLogic } from 'walktour'

const CustomTooltip = ({
  tourLogic,
  customOnClose,
}: {
  tourLogic: WalktourLogic | undefined
  customOnClose?: () => void
}) => {
  const { title, description } = tourLogic!.stepContent
  const { next, prev, close, allSteps, stepIndex } = tourLogic!

  const onClose = () => {
    if (customOnClose) {
      customOnClose()
    }
    close()
  }

  return (
    <div className="relative w-72 rounded-lg bg-gradient-to-b from-gradient-start via-gradient-mid to-gradient-end p-4">
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
    </div>
  )
}

export default CustomTooltip
