import React from 'react';
import { User, MapPin, Calendar, Clock, IdCard, Users } from 'lucide-react';

const AttendanceList = ({ attendances }) => {
  // Urutkan berdasarkan NIM (3 digit terakhir)
  const sortedAttendances = [...attendances].sort((a, b) => {
    const nimA = a.nim.slice(-3);
    const nimB = b.nim.slice(-3);
    return nimA.localeCompare(nimB);
  });

  if (sortedAttendances.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <User className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-600 mb-2">Belum ada data presensi</h3>
        <p className="text-gray-500">Data presensi akan muncul di sini setelah diisi.</p>
      </div>
    );
  }

  // Function untuk format waktu
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Function untuk format tanggal
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Function untuk get 3 digit terakhir NIM
  const getLastThreeNIM = (nim) => {
    return nim.slice(-3);
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Ringkasan Presensi Hari Ini</h3>
            <p className="text-blue-100">
              Total {sortedAttendances.length} mahasiswa • Urut berdasarkan NIM
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{sortedAttendances.length}</div>
            <div className="text-blue-100 text-sm">Hadir</div>
          </div>
        </div>
      </div>

      {/* Attendance Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedAttendances.map((attendance, index) => (
          <div 
            key={attendance.id} 
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all duration-300 hover:border-blue-300"
          >
            {/* Foto Besar - Full Width */}
            <div className="mb-4">
              {attendance.image_url ? (
                <div className="w-full h-48 rounded-xl overflow-hidden border-4 border-green-500 shadow-md">
                  <img 
                    src={attendance.image_url} 
                    alt={`Presensi ${attendance.name}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex flex-col items-center justify-center border-4 border-gray-300 shadow-md">
                  <User className="w-16 h-16 text-gray-400 mb-2" />
                  <span className="text-gray-500 text-sm font-medium">Tidak ada foto</span>
                </div>
              )}
            </div>

            {/* Header dengan Nama dan NIM */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 text-xl mb-1">{attendance.name}</h3>
                <div className="flex items-center gap-2">
                  <IdCard className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 font-mono">{attendance.nim}</span>
                </div>
              </div>
              
              {/* Badge Nomor NIM */}
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">
                  #{getLastThreeNIM(attendance.nim)}
                </span>
              </div>
            </div>

            {/* Badge Kelas */}
            <div className="mb-4">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                <Users className="w-4 h-4" />
                Kelas {attendance.kelas}
              </span>
            </div>

            {/* Detail Information */}
            <div className="space-y-3">
              {/* Lokasi */}
              {attendance.location && (
                <div className="flex items-start gap-3 bg-blue-50 rounded-lg p-3">
                  <MapPin className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 mb-1">📍 Lokasi Presensi</p>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {attendance.location}
                    </p>
                  </div>
                </div>
              )}

              {/* Tanggal & Waktu */}
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-gray-700 font-medium">{formatDate(attendance.created_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-gray-700 font-medium">{formatTime(attendance.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Status Bar */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  ✅ Hadir Tercatat
                </span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  Urutan #{index + 1}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer dengan info sorting */}
      <div className="text-center py-6">
        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-3 rounded-full border border-blue-200">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <p className="text-sm text-gray-700 font-medium">
            Menampilkan {sortedAttendances.length} presensi • Diurutkan berdasarkan 3 digit terakhir NIM
          </p>
        </div>
      </div>
    </div>
  );
};

export default AttendanceList;