import React from 'react';
import { Download } from 'lucide-react';

export default function DownloadButton({ 
  targetId = 'main-content', 
  filename = 'lifeledger-report',
  className = ""
}) {
  const downloadAsPDF = () => {
    window.print();
  };

  return (
    <button
      onClick={downloadAsPDF}
      className={`flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors ${className}`}
      title="Download as PDF"
    >
      <Download className="w-4 h-4" />
      Download PDF
    </button>
  );
}