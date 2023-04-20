import { stringify } from 'csv-stringify'

export const handleExport = (data: any[], title: string) => {
  stringify(data, { header: true }, (err, output) => {
    if (err) {
      console.error(err)
    } else {
      const csvData = 'data:text/csv;charset=utf-8,' + output
      const encodedUri = encodeURI(csvData)
      const link = document.createElement('a')
      link.setAttribute('href', encodedUri)
      link.setAttribute('download', `${title}.csv`)
      link.setAttribute('title', title)
      document.body.appendChild(link)
      link.click()
    }
  })
}
