/* eslint-disable @typescript-eslint/no-explicit-any */
export function getNetworkInfo() {
  const connection =
    (navigator as any).connection ||
    (navigator as any).mozConnection ||
    (navigator as any).webkitConnection
  if (connection) {
    return connection.effectiveType
  }
  return 'unknown'
}

export default function isNetworkSlow() {
  return ['slow-2g', '2g', '3g'].includes(getNetworkInfo()) ? true : false
}
