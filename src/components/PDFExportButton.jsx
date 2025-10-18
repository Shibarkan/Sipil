import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';

const PDFExportButton = ({ attendances, filterDate }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  // 🔹 Fungsi aman untuk konversi gambar Supabase → Base64 (tanpa CORS error)
  const toDataURL = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // penting agar bisa load dari Supabase public bucket
      img.src = `${url}?t=${Date.now()}`; // tambahkan cache-buster agar tidak ke-cache

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/jpg');
          resolve(dataURL);
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = (err) => {
        reject(err);
      };
    });
  };

  // 🔹 Fungsi utama generate PDF
  const generatePDF = async () => {
    if (attendances.length === 0) {
      alert('Tidak ada data untuk diexport!');
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');

      // ===== HEADER UTAMA =====
      pdf.setFillColor(59, 130, 246);
      pdf.rect(0, 0, 210, 30, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.text('LAPORAN PRESENSI DIGITAL', 105, 15, { align: 'center' });
      pdf.setFontSize(10);
      pdf.text(`Periode: ${filterDate || 'Hari Ini'}`, 105, 22, { align: 'center' });

      // ===== INFO RINGKAS =====
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.text(`Total Presensi: ${attendances.length} orang`, 15, 40);
      pdf.text(`Tanggal Export: ${new Date().toLocaleDateString('id-ID')}`, 15, 46);

      // ===== TABEL DATA =====
      let yPosition = 55;

      const drawTableHeader = () => {
        pdf.setFillColor(41, 128, 185);
        pdf.rect(15, yPosition, 180, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(9);
        pdf.text('No', 18, yPosition + 5);
        pdf.text('Nama', 28, yPosition + 5);
        pdf.text('NIM', 78, yPosition + 5);
        pdf.text('Kelas', 108, yPosition + 5);
        pdf.text('Lokasi', 125, yPosition + 5);
        pdf.text('Waktu', 165, yPosition + 5);
        pdf.text('Foto', 185, yPosition + 5);
      };

      drawTableHeader();
      yPosition += 12;
      pdf.setFontSize(8);

      attendances.forEach((attendance, index) => {
        if (yPosition > 270) {
          pdf.addPage();
          pdf.setFillColor(59, 130, 246);
          pdf.rect(0, 0, 210, 30, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(18);
          pdf.text('LAPORAN PRESENSI DIGITAL', 105, 15, { align: 'center' });
          pdf.setFontSize(10);
          pdf.text(`Periode: ${filterDate || 'Hari Ini'} - Lanjutan`, 105, 22, { align: 'center' });
          yPosition = 40;
          drawTableHeader();
          yPosition += 12;
        }

        // Warna selang-seling
        if (index % 2 === 0) {
          pdf.setFillColor(245, 245, 245);
          pdf.rect(15, yPosition - 4, 180, 8, 'F');
        }

        pdf.setTextColor(0, 0, 0);
        pdf.text((index + 1).toString(), 18, yPosition);
        pdf.text(attendance.name || '-', 28, yPosition, { maxWidth: 45 });
        pdf.text(attendance.nim || '-', 78, yPosition);
        pdf.text(attendance.kelas || '-', 108, yPosition);

        const location = attendance.location
          ? attendance.location.split(',')[0].substring(0, 15) +
            (attendance.location.split(',')[0].length > 15 ? '...' : '')
          : '-';
        pdf.text(location, 125, yPosition);

        const time = new Date(attendance.created_at).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        });
        pdf.text(time, 165, yPosition);
        pdf.text(attendance.image_url ? '✅' : '❌', 185, yPosition);

        yPosition += 8;
      });

      // ===== HALAMAN FOTO PRESENSI =====
      const attendancesWithPhotos = attendances.filter((att) => att.image_url);
      if (attendancesWithPhotos.length > 0) {
        pdf.addPage();
        pdf.setFillColor(59, 130, 246);
        pdf.rect(0, 0, 210, 30, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(16);
        pdf.text('BUKTI FOTO PRESENSI', 105, 15, { align: 'center' });
        pdf.setFontSize(10);
        pdf.text(`Total ${attendancesWithPhotos.length} foto tersedia`, 105, 22, { align: 'center' });

        let photoY = 40;

        for (let i = 0; i < attendancesWithPhotos.length; i++) {
          const attendance = attendancesWithPhotos[i];
          setProgress(Math.round(((i + 1) / attendancesWithPhotos.length) * 100));

          if (photoY > 200) {
            pdf.addPage();
            pdf.setFillColor(59, 130, 246);
            pdf.rect(0, 0, 210, 30, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(16);
            pdf.text('BUKTI FOTO PRESENSI (Lanjutan)', 105, 15, { align: 'center' });
            photoY = 40;
          }

          pdf.setTextColor(0, 0, 0);
          pdf.setFontSize(10);
          pdf.text(`Nama: ${attendance.name}`, 20, photoY);
          pdf.text(`NIM: ${attendance.nim}`, 20, photoY + 5);
          pdf.text(`Kelas: ${attendance.kelas}`, 20, photoY + 10);
          pdf.text(`Waktu: ${new Date(attendance.created_at).toLocaleTimeString('id-ID')}`, 20, photoY + 15);
          if (attendance.location) {
            pdf.text(`Lokasi: ${attendance.location.substring(0, 50)}`, 20, photoY + 20);
          }

          try {
            const imageData = await toDataURL(attendance.image_url);
            if (imageData) {
              pdf.addImage(imageData, 'JPG', 140, photoY, 60, 60);
            } else {
              pdf.setTextColor(255, 0, 0);
              pdf.text('(Gagal memuat gambar)', 140, photoY + 10);
            }
          } catch (error) {
            console.error('Gagal memuat gambar:', error);
            pdf.setTextColor(255, 0, 0);
            pdf.text('(Gagal memuat gambar)', 140, photoY + 10);
          }

          pdf.setDrawColor(200, 200, 200);
          pdf.line(15, photoY + 75, 195, photoY + 75);
          photoY += 85;
        }
      }

      // ===== FOOTER =====
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(100);
        pdf.text(
          `Halaman ${i} dari ${pageCount} • Generated on ${new Date().toLocaleString('id-ID')}`,
          105,
          290,
          { align: 'center' }
        );
      }

      // ===== SIMPAN FILE =====
      const fileName = `presensi_${filterDate || 'today'}_${new Date().getTime()}.pdf`;
      pdf.save(fileName);

      alert('✅ PDF berhasil dibuat!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('❌ Terjadi kesalahan saat generate PDF.');
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  return (
    <button
      onClick={generatePDF}
      disabled={attendances.length === 0 || isGenerating}
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
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
