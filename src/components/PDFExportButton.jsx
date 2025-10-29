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
        ''
      ]);

      const imagesCH = await Promise.all(sortedAttendances.map(a => toDataURL(a.foto_ch)));

      // ===== SETTING TABEL =====
      const imageWidth = 30; // mm
      const imageHeight = 40; // mm

      const bodyRowsPerPage = 3; // halaman selanjutnya 3 data
      const firstPageRows = 2;   // halaman pertama 2 data
      const totalData = tableBody.length;

      let startY = 35;
      let rowIndex = 0;

      const totalPages = Math.ceil((totalData - firstPageRows) / bodyRowsPerPage) + 1;
      let currentPage = 1;

      while (rowIndex < totalData) {
        const isFirstPage = currentPage === 1;
        const rowsThisPage = isFirstPage ? firstPageRows : bodyRowsPerPage;
        const pageData = tableBody.slice(rowIndex, rowIndex + rowsThisPage);
        const pageImages = imagesCH.slice(rowIndex, rowIndex + rowsThisPage);

        autoTable(pdf, {
          startY: startY,
          head: isFirstPage ? [['NO', 'NAMA', 'NIM', 'KELAS', 'ASAL', 'FOTO']] : undefined,
          body: pageData,
          theme: 'grid',
          styles: {
            fontSize: 9,
            cellPadding: 2,
            minCellHeight: imageHeight + 6,
            lineWidth: 0.2, // 👉 ketebalan garis tabel
          },
          columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 38 }, // nama lebih kecil
            2: { cellWidth: 30 },
            3: { cellWidth: 20 },
            4: { cellWidth: 28 },
            5: { cellWidth: imageWidth + 4 },
          },
          didDrawCell: (data) => {
            if (data.section !== 'body') return;
            const imgBase64 = pageImages[data.row.index];
            if (data.column.index === 5 && imgBase64) {
              const x = data.cell.x + (data.cell.width - imageWidth) / 2;
              const y = data.cell.y + (data.cell.height - imageHeight) / 2;
              try {
                pdf.addImage(imgBase64, 'JPEG', x, y, imageWidth, imageHeight);
              } catch (e) {
                console.warn('Gagal gambar:', e);
              }
            }
          },
        });

        // ===== FOOTER HALAMAN =====
        const pageCount = pdf.internal.getNumberOfPages();
        pdf.setFontSize(8);
        pdf.setTextColor(120);
        pdf.text(
          `Halaman ${currentPage} dari ${totalPages}`,
          pageWidth / 2,
          pdf.internal.pageSize.getHeight() - 5,
          { align: 'center' }
        );

        rowIndex += rowsThisPage;
        currentPage++;

        if (rowIndex < totalData) {
          pdf.addPage();
          startY = 20;
        }
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

export default PDFExportButton;        },
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
