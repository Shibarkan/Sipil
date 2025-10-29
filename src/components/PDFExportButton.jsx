import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

const PDFExportButton = ({ attendances, filterDate }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const toDataURL = (url) =>
    new Promise((resolve) => {
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
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
    });

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
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Header dokumen
      pdf.setFontSize(20);
      pdf.text('LAPORAN PRESENSI DIGITAL', pageWidth / 2, 15, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text(`Periode: ${filterDate || 'Semua Data'}`, pageWidth / 2, 22, { align: 'center' });
      pdf.setFontSize(9);
      pdf.text(`Generated: ${new Date().toLocaleString('id-ID')}`, pageWidth / 2, 28, { align: 'center' });

      // Sort by NIM
      const sortedAttendances = [...attendances].sort((a, b) =>
        (a.nim || '').localeCompare(b.nim || '')
      );

      // Prepare data rows (we keep empty image cell placeholder)
      const rows = sortedAttendances.map((a, i) => [
        i + 1,
        a.name || '-',
        a.nim || '-',
        a.kelas || '-',
        a.asal || '-',
        '' // image cell
      ]);

      // Convert images
      const images = await Promise.all(sortedAttendances.map((a) => toDataURL(a.foto_ch)));

      // Config ukuran gambar & baris
      const imageWidth = 28;  // mm
      const imageHeight = 36; // mm
      const rowPadding = 2;   // mm padding sela
      const minCellHeight = imageHeight + rowPadding; // set min cell height sesuai gambar

      // Paging config
      const firstPageRows = 2;
      const nextPageRows = 3;
      const totalRows = rows.length;

      // compute total pages
      let remainingAfterFirst = Math.max(0, totalRows - firstPageRows);
      const additionalPages = Math.ceil(remainingAfterFirst / nextPageRows);
      const totalPages = 1 + additionalPages;

      // iterate per page and render table per-slice
      let offset = 0;
      for (let currentPage = 1; offset < totalRows; currentPage++) {
        const isFirst = currentPage === 1;
        const take = isFirst ? firstPageRows : nextPageRows;
        const pageRows = rows.slice(offset, offset + take);
        const pageImages = images.slice(offset, offset + take);

        // startY: first page below big header, other pages a bit higher
        const startY = isFirst ? 35 : 18;

        autoTable(pdf, {
          startY,
          head: isFirst ? [['NO', 'NAMA', 'NIM', 'KELAS', 'ASAL', 'FOTO PRESENSI(CH) ']] : undefined,
          body: pageRows,
          theme: 'grid',
          styles: {
            fontSize: 8,            // lebih kecil supaya teks panjang terkompres
            cellPadding: 1.5,       // padding lebih kecil
            minCellHeight: minCellHeight,
            overflow: 'ellipsize',  // kalau teks panjang akan dipotong (....)
            valign: 'middle',
            lineWidth: 0.15,        // ketebalan garis lebih tipis
          },
          headStyles: {
            fillColor: [10, 150, 135], // tetap warna header kalau mau
            textColor: 255,
            fontSize: 9,
            halign: 'center'
          },
          columnStyles: {
            0: { cellWidth: 8, halign: 'center' },   // NO
            1: { cellWidth: 50 },                    // NAMA (lebih lebar)
            2: { cellWidth: 36, halign: 'center' },  // NIM
            3: { cellWidth: 20, halign: 'center' },  // KELAS
            4: { cellWidth: 40 },                    // ASAL
            5: { cellWidth: imageWidth + 6, halign: 'center' }, // FOTO
          },
          didDrawCell: (data) => {
            // draw images only in body and foto column (index 5)
            if (data.section !== 'body') return;
            if (data.column.index !== 5) return;

            const rowIdx = data.row.index;
            const imgBase64 = pageImages[rowIdx];
            if (!imgBase64) return;

            const cellW = data.cell.width;
            const cellH = data.cell.height;

            // center image in the cell, fixed size (imageWidth x imageHeight)
            const x = data.cell.x + (cellW - imageWidth) / 2;
            const y = data.cell.y + (cellH - imageHeight) / 2;

            try {
              pdf.addImage(imgBase64, 'JPEG', x, y, imageWidth, imageHeight);
            } catch (e) {
              // ignore image errors
              // console.warn('img add error', e);
            }
          },
          // prevent auto-splitting rows across pages (we manage pages)
          pageBreak: 'avoid'
        });

        // footer page number (we put after table)
        const pageNumX = pageWidth / 2;
        const pageNumY = pageHeight - 6;
        pdf.setFontSize(8);
        pdf.setTextColor(120);
        pdf.text(`Halaman ${currentPage} dari ${totalPages}`, pageNumX, pageNumY, { align: 'center' });

        offset += take;
        if (offset < totalRows) pdf.addPage();
      }

      // save file
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
      disabled={!attendances || attendances.length === 0 || isGenerating}
      className={`flex items-center justify-center gap-2 px-5 py-2 rounded-lg font-medium transition-all duration-200 ${
        isGenerating ? 'bg-gray-400 text-white cursor-wait' : 'bg-blue-600 text-white hover:bg-blue-700'
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
          Export PDF ({attendances ? attendances.length : 0})
        </>
      )}
    </button>
  );
};

export default PDFExportButton;
