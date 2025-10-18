import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';

const PDFExportButton = ({ attendances, filterDate }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  // === Fungsi ambil gambar Supabase ke Base64 aman (tanpa CORS error) ===
  const toDataURL = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // penting
      img.src = `${url}?t=${Date.now()}`; // cache-buster biar selalu fresh

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => reject('Gagal load gambar dari Supabase');
    });
  };

  const generatePDF = async () => {
    if (attendances.length === 0) {
      alert('Tidak ada data untuk diexport!');
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      let y = 20;

      // Header
      pdf.setFontSize(18);
      pdf.setTextColor(44, 62, 80);
      pdf.text('LAPORAN PRESENSI DIGITAL', pageWidth / 2, y, { align: 'center' });
      y += 8;
      pdf.setFontSize(11);
      pdf.setTextColor(100);
      pdf.text(`Periode: ${filterDate || 'Semua Data'}`, pageWidth / 2, y, { align: 'center' });
      y += 10;

      for (let i = 0; i < attendances.length; i++) {
        const a = attendances[i];
        setProgress(Math.round(((i + 1) / attendances.length) * 100));

        // Buat halaman baru kalau terlalu panjang
        if (y > 250) {
          pdf.addPage();
          y = 20;
        }

        pdf.setDrawColor(230);
        pdf.setFillColor(245, 245, 245);
        pdf.rect(15, y, 180, 60, 'F'); // background kotak data

        // Nama & Info Dasar
        pdf.setTextColor(33, 33, 33);
        pdf.setFontSize(12);
        pdf.text(`${a.name || '-'}`, 20, y + 10);
        pdf.setFontSize(9);
        pdf.text(`NIM: ${a.nim || '-'}`, 20, y + 16);
        pdf.text(`Kelas: ${a.kelas || '-'}`, 20, y + 22);
        pdf.text(`Lokasi: ${a.location || '-'}`, 20, y + 28);

        const waktu = new Date(a.created_at).toLocaleString('id-ID');
        pdf.text(`Waktu: ${waktu}`, 20, y + 34);

        // Gambar
        if (a.image_url) {
          try {
            const imgData = await toDataURL(a.image_url);
            pdf.addImage(imgData, 'JPEG', 135, y + 5, 50, 50);
          } catch (err) {
            console.warn(err);
            pdf.setTextColor(200, 0, 0);
            pdf.text('Foto gagal dimuat', 135, y + 20);
          }
        } else {
          pdf.setTextColor(150);
          pdf.text('(Tidak ada foto)', 135, y + 20);
        }

        y += 70;
      }

      // Footer
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(120);
        pdf.text(
          `Halaman ${i} dari ${pageCount} • Generated ${new Date().toLocaleString('id-ID')}`,
          pageWidth / 2,
          290,
          { align: 'center' }
        );
      }

      // Simpan PDF
      const fileName = `presensi_${filterDate || 'semua'}_${Date.now()}.pdf`;
      pdf.save(fileName);
      alert('✅ PDF berhasil dibuat!');
    } catch (err) {
      console.error(err);
      alert('❌ Gagal membuat PDF');
    } finally {
      setIsGenerating(false);
      setProgress(0);
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
          Membuat PDF... {progress}%
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
