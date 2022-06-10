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
        className={`border-th-bkg-4 flex h-full items-center justify-between border-b p-3 font-bold text-mango-200 hover:text-yellow-400 md:border-none md:py-0
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
