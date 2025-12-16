import React from 'react'
import { Download } from 'lucide-react'

const PdfDownloadButton = () => {
  const handleDownload = () => {
    // Get current page content
    const content = document.querySelector('[id$="-content"]') || document.body
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>LifeLedger Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .no-print { display: none !important; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .grid { display: block; }
            .grid > div { margin: 10px 0; padding: 10px; border: 1px solid #eee; }
          </style>
        </head>
        <body>
          <h1>LifeLedger Report</h1>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
          ${content.innerHTML}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
    printWindow.close()
  }

  return (
    <button
      onClick={handleDownload}
      className="p-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors"
      title="Download PDF"
    >
      <Download className="w-5 h-5" />
    </button>
  )
}

export default PdfDownloadButton