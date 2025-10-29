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

      // ===== HEADER =====
      pdf.setFontSize(20);
      pdf.text('LAPORAN PRESENSI DIGITAL', pageWidth / 2, 15, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text(`Periode: ${filterDate || 'Semua Data'}`, pageWidth / 2, 22, { align: 'center' });
      pdf.setFontSize(10);
      pdf.text(`Generated: ${new Date().toLocaleString('id-ID')}`, pageWidth / 2, 28, { align: 'center' });

      // ===== URUTKAN DATA BERDASARKAN NIM =====
      const sortedAttendances = [...attendances].sort((a, b) =>
        (a.nim || '').localeCompare(b.nim || '')
      );

      // ===== SIAPKAN DATA =====
      const tableBody = sortedAttendances.map((a, i) => [
        i + 1,
        a.name || '-',
        a.nim || '-',
        a.kelas || '-',
        a.asal || '-',
        '' // kolom gambar CH
      ]);

      const imagesCH = await Promise.all(sortedAttendances.map(a => toDataURL(a.foto_ch)));

      // ===== SETTING TABEL DAN GAMBAR =====
      const imageWidth = 30; // mm
      const imageHeight = 40; // mm

      autoTable(pdf, {
        startY: 35,
        head: [['NO', 'NAMA', 'NIM', 'KELAS', 'ASAL', 'FOTO PRESENSI']],
        body: tableBody,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2, minCellHeight: imageHeight + 4 },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 40 },
          2: { cellWidth: 35 },
          3: { cellWidth: 25 },
          4: { cellWidth: 40 },
          5: { cellWidth: imageWidth + 5 },
        },
        showHead: 'firstPage', // ✅ header hanya di halaman pertama
        didDrawCell: (data) => {
          if (data.section !== 'body') return;
          const rowIndex = data.row.index;

          if (data.column.index === 5) {
            const imgBase64 = imagesCH[rowIndex];
            if (!imgBase64) return;

            // Gambar ukuran tetap, tabel menyesuaikan
            const cellWidth = data.cell.width;
            const cellHeight = data.cell.height;

            const x = data.cell.x + (cellWidth - imageWidth) / 2;
            const y = data.cell.y + (cellHeight - imageHeight) / 2;

            try {
              pdf.addImage(imgBase64, 'JPEG', x, y, imageWidth, imageHeight);
            } catch (e) {
              console.warn('Gagal menambah gambar di baris', rowIndex, e);
            }
          }
        },
      });

      // ===== FOOTER =====
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(120);
        pdf.text(
          `Halaman ${i} dari ${pageCount}`,
          pageWidth / 2,
          pdf.internal.pageSize.getHeight() - 5,
          { align: 'center' }
        );
      }

      // ===== SIMPAN PDF =====
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
