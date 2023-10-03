const Badge = ({ label, fillColor }: { label: string; fillColor: string }) => {
  return (
    <div className={`w-max rounded-full px-3 py-0.5 ${fillColor}`}>
      <p className="font-rewards text-base text-black">{label}</p>
    </div>
  )
}

export default Badge

// const Badge = ({
//   label,
//   fillColor,
//   shadowColor,
//   borderColor,
// }: {
//   label: string
//   fillColor?: string
//   shadowColor?: string
//   borderColor: string
// }) => {
//   return (
//     <div
//       className="w-max rounded-full border px-3 py-1"
//       style={{
//         background: fillColor ? fillColor : 'transparent',
//         borderColor: borderColor,
//         boxShadow: shadowColor ? `0px 0px 8px 0px ${shadowColor}` : 'none',
//       }}
//     >
//       <span style={{ color: fillColor ? 'var(--fgd-1)' : borderColor }}>
//         {label}
//       </span>
//     </div>
//   )
// }

// export default Badge
