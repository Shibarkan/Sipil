import React from 'react';
import { Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const PDFExportButton = ({ attendances, filterDate }) => {
  const generatePDF = async () => {
    if (attendances.length === 0) {
      alert('Tidak ada data untuk diexport!');
      return;
    }

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      let yPosition = 15;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 15;

      // Header dengan gradient effect
      pdf.setFillColor(59, 130, 246);
      pdf.rect(0, 0, pageWidth, 25, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.text('LAPORAN PRESENSI DIGITAL', pageWidth / 2, 12, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.text(`Periode: ${filterDate || 'Semua Data'}`, pageWidth / 2, 18, { align: 'center' });
      
      yPosition = 30;

      for (let i = 0; i < attendances.length; i++) {
        const attendance = attendances[i];

        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 15;
          
          // Header untuk halaman baru
          pdf.setFillColor(59, 130, 246);
          pdf.rect(0, 0, pageWidth, 25, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(16);
          pdf.text('LAPORAN PRESENSI DIGITAL', pageWidth / 2, 12, { align: 'center' });
          yPosition = 30;
        }

        const tempDiv = document.createElement('div');
        tempDiv.style.width = '180mm';
        tempDiv.style.padding = '20px';
        tempDiv.style.border = '2px solid #e5e7eb';
        tempDiv.style.borderRadius = '16px';
        tempDiv.style.backgroundColor = 'white';
        tempDiv.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        tempDiv.style.marginBottom = '10px';
        
        tempDiv.innerHTML = `
          <div style="display: flex; gap: 20px; align-items: start; font-family: Arial, sans-serif;">
            ${attendance.image ? `
              <div style="width: 120px; height: 120px; flex-shrink: 0;">
                <img src="${attendance.image}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px; border: 3px solid #10b981;" />
              </div>
            ` : ''}
            
            <div style="flex: 1;">
              <!-- Header dengan Nama, NIM, Kelas -->
              <div style="margin-bottom: 15px;">
                <h3 style="font-size: 18px; font-weight: bold; color: #1f2937; margin: 0 0 8px 0;">${attendance.name}</h3>
                <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                  <div style="background: #dbeafe; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; color: #1e40af;">
                    NIM: ${attendance.nim}
                  </div>
                  <div style="background: #dcfce7; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; color: #166534;">
                    Kelas: ${attendance.kelas}
                  </div>
                  <div style="background: #fef3c7; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; color: #92400e;">
                    ${attendance.timestamp}
                  </div>
                </div>
              </div>
              
              <!-- Detail Information -->
              <div style="display: grid; gap: 8px; font-size: 11px;">
                ${attendance.department ? `
                  <div style="display: flex; align-items: center; gap: 8px; padding: 6px 0;">
                    <span style="font-weight: bold; color: #374151; min-width: 80px;">Mata Kuliah:</span>
                    <span style="color: #6b7280;">${attendance.department}</span>
                  </div>
                ` : ''}
                
                ${attendance.location ? `
                  <div style="display: flex; align-items: start; gap: 8px; padding: 6px 0;">
                    <span style="font-weight: bold; color: #374151; min-width: 80px;">Lokasi:</span>
                    <span style="color: #6b7280; font-size: 10px; line-height: 1.3;">${attendance.location}</span>
                  </div>
                ` : ''}
              </div>
              
              ${attendance.notes ? `
                <div style="margin-top: 12px; padding: 10px; background: #eff6ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
                  <p style="font-size: 10px; color: #1e40af; margin: 0; font-weight: bold;">Catatan:</p>
                  <p style="font-size: 10px; color: #374151; margin: 2px 0 0 0;">${attendance.notes}</p>
                </div>
              ` : ''}
            </div>
          </div>
        `;

        document.body.appendChild(tempDiv);

        const canvas = await html2canvas(tempDiv, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          logging: false
        });

        document.body.removeChild(tempDiv);

        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        const imgWidth = pageWidth - (margin * 2);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'JPEG', margin, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 8;
      }

      const fileName = `presensi_${filterDate || 'all'}_${new Date().getTime()}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error saat generate PDF. Silakan coba lagi.');
    }
  };

  return (
    <button
      onClick={generatePDF}
      disabled={attendances.length === 0}
      className="flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
    >
      <Download className="w-5 h-5" />
      Export PDF ({attendances.length})
    </button>
  );
};

export default PDFExportButton;