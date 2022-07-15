const TradeIcon = ({ className }: { className: string }) => {
  return (
    <svg
      className={`${className}`}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="currentColor"
    >
      <path d="M7 4C5.34315 4 4 5.34315 4 7V21.9199L15.3027 11.3572C15.8558 10.8403 16.7073 10.8166 17.2884 11.3018L20.0552 13.6124L27.8668 6.1133C27.4886 4.8893 26.3482 4 25 4H7Z" />
      <path d="M28 10.1441L21.1637 16.707C20.612 17.2365 19.7503 17.2664 19.1634 16.7762L16.3827 14.454L4.13677 25.8982C4.5185 27.1163 5.65604 28 7 28H25C26.6569 28 28 26.6569 28 25V10.1441Z" />
    </svg>
  )
}

export default TradeIcon
