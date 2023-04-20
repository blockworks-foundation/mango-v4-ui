import { notify } from './notifications'
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

// /**
//  * Function to export data to CSV file.
//  *
//  * @param dataToExport Array of objects for exporting
//  * @param filename Name of exported file
//  * @param headers Column headders
//  * @param t Translation function since it cannot be called here
//  */
// export function exportDataToCSV(
//   dataToExport: Array<any>,
//   title: string,
//   headers: Array<string>,
//   t: any
// ) {
//   if (dataToExport.length == 0) {
//     notify({
//       title: t('export-data-empty'),
//       description: '',
//       type: 'info',
//     })
//     return
//   }

//   const options = {
//     fieldSeparator: ',',
//     quoteStrings: '"',
//     decimalSeparator: '.',
//     showLabels: true,
//     showTitle: false,
//     filename: title,
//     useTextFile: false,
//     useBom: true,
//     headers: headers,
//   }

//   const exporter = new ExportToCsv(options)
//   exporter.generateCsv(dataToExport)

//   notify({
//     title: t('export-data-success'),
//     description: '',
//   })
// }
