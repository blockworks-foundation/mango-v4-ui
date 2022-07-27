const WalletIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      className={`${className}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17.999 3c1.103 0 2 .897 2 2v2c1.103 0 2 .897 2 2v10c0 1.103-.897 2-2 2h-15c-1.206 0-3-.799-3-3V6c0-1.654 1.346-3 3-3h13Zm0 2h-13a1.001 1.001 0 0 0 0 2h13V5Zm-1.001 7a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0v-2a1 1 0 0 0-1-1Z"
      />
    </svg>
  )
}

export default WalletIcon
