import { useRouter } from 'next/router'
import Link from 'next/link'
import { ChevronRightIcon } from '@heroicons/react/20/solid'

type MenuItemProps = {
  href: string
  children: React.ReactNode
  newWindow?: boolean
}

const MenuItem = ({ href, children, newWindow = false }: MenuItemProps) => {
  const { asPath } = useRouter()

  return (
    <Link
      href={href}
      shallow={true}
      className={`text-mango-200 flex h-full items-center justify-between border-b border-th-bkg-4 p-3 font-bold hover:text-yellow-400 md:border-none md:py-0
        ${asPath === href ? `text-th-active` : `border-transparent`}
      `}
      target={newWindow ? '_blank' : ''}
      rel={newWindow ? 'noopener noreferrer' : ''}
    >
      {children}
      <ChevronRightIcon className="h-5 w-5 md:hidden" />
    </Link>
  )
}

export default MenuItem
