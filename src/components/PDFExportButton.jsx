import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

const PDFExportButton = ({ attendances, filterDate }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const toDataURL = (url) => {
    return new Promise((resolve) => {
      if (!url) return resolve(null);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = `${url}?t=${Date.now()}`;
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
    });
  };

  const generatePDF = async () => {
    if (!attendances || attendances.length === 0) {
      toast.error('Tidak ada data untuk diexport!');
      return;
    }

    setIsGenerating(true);
    const loadingToast = toast.loading('Sedang membuat PDF...');

    try {
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();

      // Header
      pdf.setFontSize(20);
      pdf.text('LAPORAN PRESENSI DIGITAL', pageWidth / 2, 15, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text(`Periode: ${filterDate || 'Semua Data'}`, pageWidth / 2, 22, { align: 'center' });
      pdf.setFontSize(10);
      pdf.text(`Generated: ${new Date().toLocaleString('id-ID')}`, pageWidth / 2, 28, { align: 'center' });

      // Body
      const tableBody = attendances.map((a, i) => [
        i + 1,
        a.name || '-',
        a.nim || '-',
        a.kelas || '-',
        a.asal || '-',
        '',
        ''
      ]);

      const imagesCH = await Promise.all(attendances.map(a => toDataURL(a.foto_ch)));
      const imagesDies = await Promise.all(attendances.map(a => toDataURL(a.foto_dies)));

      autoTable(pdf, {
        startY: 35,
        head: [['NO', 'NAMA', 'NIM', 'KELAS', 'ASAL', 'CH', 'Dies Natalis']],
        body: tableBody,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2, minCellHeight: 42 },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 35 },
          2: { cellWidth: 30 },
          3: { cellWidth: 20 },
          4: { cellWidth: 35 },
          5: { cellWidth: 30 },
          6: { cellWidth: 30 }
        },
        didDrawCell: (data) => {
          if (data.section !== 'body') return;
          const rowIndex = data.row.index;

          const drawImageFit = (imgBase64) => {
            if (!imgBase64) return;
            const cellWidth = data.cell.width;
            const cellHeight = data.cell.height;
            const targetW = 30;
            const targetH = 40;
            const scale = Math.min(cellWidth / targetW, cellHeight / targetH);
            const w = targetW * scale;
            const h = targetH * scale;
            const x = data.cell.x + (cellWidth - w) / 2;
            const y = data.cell.y + (cellHeight - h) / 2;
            pdf.addImage(imgBase64, 'JPEG', x, y, w, h);
          };

          if (data.column.index === 5) drawImageFit(imagesCH[rowIndex]);
          if (data.column.index === 6) drawImageFit(imagesDies[rowIndex]);
        },
      });

      // Footer
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(120);
        pdf.text(`Halaman ${i} dari ${pageCount}`, pageWidth / 2, pdf.internal.pageSize.getHeight() - 5, { align: 'center' });
      }

      pdf.save(`presensi_${filterDate || 'semua'}_${Date.now()}.pdf`);
      toast.success('PDF berhasil dibuat!', { id: loadingToast });
    } catch (err) {
      console.error(err);
      toast.error('Gagal membuat PDF', { id: loadingToast });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={generatePDF}
      disabled={attendances.length === 0 || isGenerating}
      className={`flex items-center justify-center gap-2 px-5 py-2 rounded-lg font-medium transition-all duration-200 ${
        isGenerating
          ? 'bg-gray-400 text-white cursor-wait'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Membuat PDF...
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          Export PDF ({attendances.length})
        </>
      )}
    </button>
  );
};

export default PDFExportButton;
