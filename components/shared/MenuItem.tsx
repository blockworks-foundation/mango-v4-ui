import { useRouter } from 'next/router'
import Link from 'next/link'
import { ChevronRightIcon } from '@heroicons/react/solid'

type MenuItemProps = {
  href: string
  children: React.ReactNode
  newWindow?: boolean
}

const MenuItem = ({ href, children, newWindow = false }: MenuItemProps) => {
  const { asPath } = useRouter()

  return (
    <Link href={href} shallow={true}>
      <a
        className={`border-th-bkg-4 text-th-fgd-1 hover:text-th-primary flex h-full items-center justify-between border-b p-3 font-bold md:border-none md:py-0
          ${asPath === href ? `text-th-primary` : `border-transparent`}
        `}
        target={newWindow ? '_blank' : ''}
        rel={newWindow ? 'noopener noreferrer' : ''}
      >
        {children}
        <ChevronRightIcon className="h-5 w-5 md:hidden" />
      </a>
    </Link>
  )
}

export default MenuItem
