import React from 'react';
import { User, MapPin, Calendar, Clock, Building, IdCard, Users } from 'lucide-react';

const AttendanceList = ({ attendances }) => {
  if (attendances.length === 0) {
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

  return (
    <div className="space-y-6">
      {attendances.map((attendance) => (
        <div key={attendance.id} className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 bg-white">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Image Section - Larger */}
            {attendance.image && (
              <div className="lg:w-48 lg:h-48 w-full h-64">
                <img 
                  src={attendance.image} 
                  alt="Attendance" 
                  className="w-full h-full object-cover rounded-xl border-4 border-green-500 shadow-md"
                />
              </div>
            )}
            
            {/* Details Section */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{attendance.name}</h3>
                  
                  {/* NIM & Kelas */}
                  <div className="flex flex-wrap gap-4 mb-4">
                    <div className="flex items-center gap-2 bg-blue-100 px-3 py-1 rounded-full">
                      <IdCard className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">NIM: {attendance.nim}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full">
                      <Users className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Kelas: {attendance.kelas}</span>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {attendance.department && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Building className="w-4 h-4 text-gray-600 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-700">Mata Kuliah</p>
                          <p className="text-gray-600">{attendance.department}</p>
                        </div>
                      </div>
                    )}
                    
                    {attendance.location && (
                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <MapPin className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-700">Lokasi</p>
                          <p className="text-gray-600 text-xs">{attendance.location}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Calendar className="w-4 h-4 text-purple-600 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-700">Tanggal</p>
                        <p className="text-gray-600">{attendance.timestamp.split(',')[0]}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Clock className="w-4 h-4 text-orange-600 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-700">Waktu</p>
                        <p className="text-gray-600">{attendance.timestamp.split(',')[1]?.trim()}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Status Badge */}
                <div className="mt-4 sm:mt-0 sm:ml-4">
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg">
                    ✅ Tercatat
                  </span>
                </div>
              </div>
              
              {/* Notes */}
              {attendance.notes && (
                <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-sm font-medium text-blue-800 mb-1">📝 Catatan:</p>
                  <p className="text-sm text-blue-700">{attendance.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AttendanceList;