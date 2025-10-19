// src/components/AttendanceList.jsx
import React from 'react';
import { User, MapPin, Calendar, Clock, IdCard, Users, Map } from 'lucide-react';

const AttendanceList = ({ attendances }) => {
  // Urutkan berdasarkan NIM (3 digit terakhir) dengan guard
  const sortedAttendances = [...attendances].sort((a, b) => {
    const nimA = a.nim ? a.nim.slice(-3) : '';
    const nimB = b.nim ? b.nim.slice(-3) : '';
    return nimA.localeCompare(nimB);
  });

  if (!sortedAttendances || sortedAttendances.length === 0) {
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

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getLastThreeNIM = (nim) => (nim ? nim.slice(-3) : '--');

  return (
    <div className="space-y-4">
      {/* Header Total Presensi */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Total Presensi Hari Ini</h3>
            <p className="text-blue-100">{sortedAttendances.length} mahasiswa</p>
          </div>
          <div className="text-right">
            <p className="text-sm">Update terakhir</p>
            <p className="font-medium">{new Date().toLocaleTimeString('id-ID')}</p>
          </div>
        </div>
      </div>

      {/* List Mahasiswa */}
      <div className="grid gap-4">
        {sortedAttendances.map((attendance, index) => (
          <div
            key={attendance.id || index}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                {/* Avatar / NIM */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {getLastThreeNIM(attendance.nim)}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  {/* Nama & Kelas */}
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 text-lg truncate">{attendance.name}</h3>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">{attendance.kelas}</span>
                  </div>

                  {/* Status Kegiatan */}
                  <div className="flex items-center gap-2 mb-2">
                    {attendance.foto_ch && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">Sudah CH</span>
                    )}
                    {attendance.foto_dies && (
                      <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-medium">Sudah Dies</span>
                    )}
                  </div>

                  {/* Detail Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <IdCard className="w-4 h-4 text-blue-500" />
                      <span>NIM: {attendance.nim || '-'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <Map className="w-4 h-4 text-green-500" />
                      <span>Asal: {attendance.asal || '-'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4 text-red-500" />
                      <span className="truncate">{attendance.location || 'Lokasi tidak tersedia'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4 text-purple-500" />
                      <span>{formatTime(attendance.created_at)}</span>
                    </div>
                  </div>

                  {/* Foto Kegiatan */}
                  <div className="flex gap-3 mt-3">
                    {attendance.foto_ch && (
                      <div className="text-center">
                        <img
                          src={attendance.foto_ch}
                          alt="Chant Class"
                          className="w-16 h-16 object-cover rounded-lg border-2 border-green-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Chant Class</p>
                      </div>
                    )}
                    {attendance.foto_dies && (
                      <div className="text-center">
                        <img
                          src={attendance.foto_dies}
                          alt="Dies Natalis"
                          className="w-16 h-16 object-cover rounded-lg border-2 border-purple-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Dies Natalis</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tanggal / Jam */}
              <div className="flex-shrink-0 text-right">
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-1 text-gray-500 text-sm">
                    <Calendar className="w-3 h-3" />
                    {formatDate(attendance.created_at)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(attendance.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttendanceList;
