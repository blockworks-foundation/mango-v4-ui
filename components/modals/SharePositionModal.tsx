import { Group, PerpPosition } from '@blockworks-foundation/mango-v4'
import { TwitterIcon } from '@components/icons/TwitterIcon'
import Button from '@components/shared/Button'
import { Dialog } from '@headlessui/react'
import { DocumentDuplicateIcon } from '@heroicons/react/20/solid'
import { useScreenshot } from 'hooks/useScreenshot'
import { useTranslation } from 'next-i18next'
import { createRef, useEffect, useMemo, useState } from 'react'
import { ModalProps } from 'types/modal'
import { ttCommons, ttCommonsExpanded, ttCommonsMono } from 'utils/fonts'
import { formatNumericValue, getDecimalCount } from 'utils/numbers'

interface SharePositionModalProps {
  group: Group
  position: PerpPosition
}

type ModalCombinedProps = SharePositionModalProps & ModalProps

async function copyToClipboard(image: HTMLCanvasElement) {
  try {
    image.toBlob((blob: Blob | null) => {
      if (blob) {
        navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      }
    }, 'image/png')
  } catch (error) {
    console.error(error)
  }
}

const SharePositionModal = ({
  group,
  isOpen,
  onClose,
  position,
}: ModalCombinedProps) => {
  const { t } = useTranslation('trade')
  const ref = createRef<HTMLDivElement>()
  const [copied, setCopied] = useState(false)
  const [showButton, setShowButton] = useState(true)
  const [image, takeScreenshot] = useScreenshot()
  const market = group.getPerpMarketByMarketIndex(position.marketIndex)
  const basePosition = position.getBasePositionUi(market)
  const entryPrice = position.getAverageEntryPriceUi(market)
  const side = basePosition > 0 ? 'long' : 'short'

  const roi = useMemo(() => {
    if (!market) return 0
    let roi
    const indexPrice = market.uiPrice
    if (basePosition > 0) {
      roi = (indexPrice / entryPrice - 1) * 100
    } else {
      roi = (indexPrice / entryPrice - 1) * -100
    }
    return roi
  }, [basePosition, entryPrice, market])

  useEffect(() => {
    if (image) {
      copyToClipboard(image)
      setCopied(true)
      setShowButton(true)
    }
  }, [image])

  useEffect(() => {
    // if the button is hidden we are taking a screenshot
    if (!showButton) {
      takeScreenshot(ref.current as HTMLElement)
    }
  }, [showButton])

  const handleCopyToClipboard = () => {
    setShowButton(false)
  }

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-40 overflow-y-auto"
    >
      <div
        className="fixed inset-0 backdrop-brightness-[0.3]"
        aria-hidden="true"
      />
      <div className="fixed inset-0 flex flex-col items-center justify-center text-center">
        <Dialog.Panel
          className={`relative flex flex-col items-center ${ttCommons.variable} ${ttCommonsExpanded.variable} ${ttCommonsMono.variable}`}
        >
          <div
            className="relative h-[338px] w-[600px] overflow-hidden border border-slate-700 bg-gradient-to-b from-slate-900 to-black pt-6"
            ref={ref}
          >
            <div className="w-1/2 text-left">
              <div className="px-8">
                <img
                  className="mb-8 h-7 w-auto shrink-0"
                  src="/logos/logo-with-text.svg"
                  alt="Mango"
                />
                <div className="mb-4 flex items-center">
                  <p
                    className={`font-display text-base uppercase text-th-fgd-1 ${
                      side === 'long' ? 'text-th-up' : 'text-th-down'
                    }`}
                  >
                    {side}
                  </p>
                  <span className="mx-2 text-base text-th-fgd-4">|</span>
                  <p className="font-display text-base text-white">
                    {market.name}
                  </p>
                </div>
                <div
                  className={`mb-4 font-display text-5xl ${
                    roi >= 0 ? 'text-th-up' : 'text-th-down'
                  }`}
                >
                  {roi >= 0 ? '+' : ''}
                  {roi.toFixed(2)}%
                </div>
                <div className="flex justify-between">
                  <p className="mb-2 text-base text-gray-500">
                    {t('avg-entry-price')}
                  </p>
                  <p className="ml-2 font-mono text-base text-white">
                    {formatNumericValue(
                      entryPrice,
                      getDecimalCount(market.tickSize),
                    )}
                  </p>
                </div>
                <div className="flex justify-between">
                  <p className="text-base text-gray-500">
                    {t('current-price')}
                  </p>
                  <p className="ml-2 font-mono text-base text-white">
                    {formatNumericValue(
                      market.uiPrice,
                      getDecimalCount(market.tickSize),
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute left-0 top-0">
              <img
                src={roi >= 0 ? '/images/space.svg' : '/images/underwater.svg'}
                alt="Share Background"
              />
            </div>
          </div>
          {copied ? (
            <a
              href={`https://twitter.com/intent/tweet?text=I'm ${side.toUpperCase()} %24${
                market.name
              } on %40mangomarkets%0A[PASTE IMAGE HERE]`}
              target="_blank"
              rel="noreferrer"
            >
              <Button className="mt-6 flex items-center">
                <TwitterIcon className="mr-2 h-5 w-5 text-th-fgd-1" />
                {t('tweet-position')}
              </Button>
            </a>
          ) : (
            <Button
              className="mt-6 flex items-center"
              onClick={handleCopyToClipboard}
            >
              <DocumentDuplicateIcon className="mr-2 h-5 w-5 text-th-fgd-1" />
              {t('copy-and-share')}
            </Button>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}

export default SharePositionModal
