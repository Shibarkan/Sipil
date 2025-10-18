import React, { useState } from 'react';
import AttendanceForm from './components/AttendanceForm';
import AttendanceList from './components/AttendanceList';
import PDFExportButton from './components/PDFExportButton';
import { Users, Calendar, Download } from 'lucide-react';

function App() {
  const [attendances, setAttendances] = useState([]);
  const [filterDate, setFilterDate] = useState('');

  const addAttendance = (data) => {
    const newAttendance = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      ...data
    };
    setAttendances(prev => [newAttendance, ...prev]);
  };

  const filteredAttendances = filterDate
    ? attendances.filter(att => att.timestamp.includes(filterDate))
    : attendances;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-xl">
              <Users className="text-white w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800">Digital Presensi</h1>
          </div>
          <p className="text-gray-600 text-lg">Sistem presensi modern dengan export PDF</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Form Presensi
              </h2>
              <AttendanceForm onSubmit={addAttendance} />
            </div>
          </div>

          {/* List & Export Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Data Presensi</h2>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  
                  <PDFExportButton 
                    attendances={filteredAttendances} 
                    filterDate={filterDate}
                  />
                </div>
              </div>

              <AttendanceList attendances={filteredAttendances} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;