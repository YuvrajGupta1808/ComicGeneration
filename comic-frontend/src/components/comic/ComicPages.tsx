import jsPDF from 'jspdf';
import { Download } from 'lucide-react';
import React, { useState } from 'react';

interface ComicPagesProps {
  pages: string[];
}

const ComicPages: React.FC<ComicPagesProps> = ({ pages }) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownload = async (pageUrl: string, pageNumber: number) => {
    try {
      const response = await fetch(pageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `comic-page-${pageNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download page:', error);
    }
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      // A4 dimensions in mm
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pages.length; i++) {
        // Fetch image as base64
        const response = await fetch(pages[i]);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });

        // Add new page for each image (except first)
        if (i > 0) {
          pdf.addPage();
        }

        // Add image to fill the entire page
        pdf.addImage(base64, 'PNG', 0, 0, pageWidth, pageHeight);
      }

      // Save the PDF
      pdf.save('comic.pdf');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Simple small images - left aligned */}
      <div className="space-y-3">
        {pages.map((pageUrl, index) => (
          <div key={index}>
            <img
              src={pageUrl}
              alt={`Page ${index + 1}`}
              className="w-full max-w-md"
            />
          </div>
        ))}
      </div>

      {/* Simple download link */}
      <button
        onClick={handleDownloadPDF}
        disabled={isGeneratingPDF}
        className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300 underline hover:no-underline disabled:opacity-50"
      >
        <Download className="w-4 h-4" />
        {isGeneratingPDF ? 'Generating...' : 'Download comic'}
      </button>
    </div>
  );
};

export default ComicPages;
