import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import { useViewport } from 'hooks/useViewport'
import { ReactNode, useRef } from 'react'
import { breakpoints } from 'utils/theme'
import Slider from 'react-slick'
import Image from 'next/image'
import { usePlausible } from 'next-plausible'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { AppAnnouncement, fetchCMSAnnounements } from 'utils/contentful'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { SHOW_ANNOUNCEMENTS_KEY } from 'utils/constants'
import { LinkButton } from '@components/shared/Button'
import { useTranslation } from 'react-i18next'

const Announcements = () => {
  const { width } = useViewport()
  const { t } = useTranslation('account')
  const [showAnnouncements, setShowAnnouncements] = useLocalStorageState(
    SHOW_ANNOUNCEMENTS_KEY,
    true,
  )

  const { data: announcements } = useQuery(
    ['announcements-data'],
    () => fetchCMSAnnounements(),
    {
      cacheTime: 1000 * 60 * 15,
      staleTime: 1000 * 60 * 5,
      retry: 3,
      refetchOnWindowFocus: false,
    },
  )

  const sliderSettings = {
    arrows: false,
    dots: false,
    infinite: true,
    slidesToShow: 3,
    slidesToScroll: 1,
    cssEase: 'linear',
    responsive: [
      {
        breakpoint: breakpoints.xl,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: breakpoints.lg,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  }

  const sliderRef = useRef<Slider | null>(null)

  const nextSlide = () => {
    if (sliderRef.current) {
      sliderRef.current.slickNext()
    }
  }

  const prevSlide = () => {
    if (sliderRef.current) {
      sliderRef.current.slickPrev()
    }
  }

  const slides = width >= breakpoints.xl ? 3 : width >= breakpoints.lg ? 2 : 1
  const showArrows = announcements?.length
    ? slides < announcements.length
    : false

  return announcements?.length && showAnnouncements ? (
    <div className="px-2 pt-10 md:px-4">
      <div className="flex items-center justify-center">
        {showArrows ? (
          <button
            className="mr-4 flex h-8 w-8 items-center justify-center rounded-full border-2 border-th-bkg-4"
            onClick={prevSlide}
          >
            <ChevronLeftIcon className="h-5 w-5 text-th-fgd-1" />
          </button>
        ) : null}
        <div className={` ${showArrows ? 'w-[calc(100%-120px)]' : 'w-full'}`}>
          <Slider ref={sliderRef} {...sliderSettings}>
            {announcements.map((announcement, i) => (
              <div className="px-2" key={announcement.title + i}>
                <Announcement data={announcement} />
              </div>
            ))}
          </Slider>
        </div>
        {showArrows ? (
          <button
            className="ml-4 flex h-8 w-8 items-center justify-center rounded-full border-2 border-th-bkg-4"
            onClick={nextSlide}
          >
            <ChevronRightIcon className="h-5 w-5 text-th-fgd-1" />
          </button>
        ) : null}
      </div>
      <div className="mt-2 flex justify-center px-2 md:justify-end">
        <LinkButton
          className="text-xs font-normal text-th-fgd-3"
          onClick={() => setShowAnnouncements(false)}
        >
          {t('hide-announcements')}
        </LinkButton>
      </div>
    </div>
  ) : null
}

export default Announcements

const classNames =
  'bg-th-bkg-2 p-4 rounded-lg block w-full md:hover:bg-th-bkg-3'

const AnnouncementWrapper = ({
  children,
  isExternal,
  path,
}: {
  children: ReactNode
  isExternal: boolean
  path: string
}) => {
  const telemetry = usePlausible()

  const trackClick = () => {
    telemetry('announcement', {
      props: {
        path: path,
      },
    })
  }

  return isExternal ? (
    <a
      className={classNames}
      href={path}
      rel="noopener noreferrer"
      target="_blank"
      onClick={trackClick}
    >
      {children}
    </a>
  ) : (
    <Link className={classNames} href={path} onClick={trackClick} shallow>
      {children}
    </Link>
  )
}

const Announcement = ({ data }: { data: AppAnnouncement }) => {
  const { linkPath, description, image, title } = data
  const imageSrc = image?.src
  const imageAlt = image?.alt || 'CTA Image'
  const isExtenalLink = linkPath.includes('http')
  return (
    <AnnouncementWrapper isExternal={isExtenalLink} path={linkPath}>
      <span className="flex items-center space-x-3">
        {imageSrc ? (
          <Image
            className="shrink-0 rounded-full"
            src={`https:${imageSrc}`}
            alt={imageAlt}
            height={48}
            width={48}
          />
        ) : null}
        <div>
          <p className="block font-display text-sm text-th-fgd-1">{title}</p>
          <p className="block text-sm text-th-fgd-3">{description}</p>
        </div>
      </span>
      {/* <ChevronRightIcon className="ml-3 h-6 w-6 text-th-fgd-4 flex-shrink-0" /> */}
    </AnnouncementWrapper>
  )
}
