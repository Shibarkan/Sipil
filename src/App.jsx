import React, { useState, useEffect } from 'react';
import AttendanceForm from './components/AttendanceForm';
import AttendanceList from './components/AttendanceList';
import PDFExportButton from './components/PDFExportButton';
import SplashScreen from './components/SplashScreen';
import { Users, Calendar, Database, Clock } from 'lucide-react';
import { supabase } from './lib/supabase';
import { Toaster } from 'react-hot-toast';


function App() {
  const [attendances, setAttendances] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [userNIM, setUserNIM] = useState('');
  const [showSplash, setShowSplash] = useState(true);

  // Set tanggal hari ini dengan timezone Indonesia
  const getTodayDate = () => {
    const now = new Date();
    const offset = 7 * 60; // GMT+7 untuk WIB
    const localDate = new Date(now.getTime() + offset * 60 * 1000);
    return localDate.toISOString().split('T')[0];
  };

  const today = getTodayDate();

  // Fetch data presensi hari ini dengan filter yang lebih akurat
  const fetchTodayAttendances = async () => {
    try {
      const startDate = new Date(today + 'T00:00:00.000+07:00');
      const endDate = new Date(today + 'T23:59:59.999+07:00');

      const { data, error } = await supabase
        .from('attendances')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAttendances(data || []);
    } catch (error) {
      console.error('Error fetching attendances:', error);
      alert('Error mengambil data presensi');
    } finally {
      setIsLoading(false);
    }
  };

  // Cek apakah user sudah absen hari ini
  const checkTodayAttendance = async (nim) => {
    if (!nim) return;

    try {
      const startDate = new Date(today + 'T00:00:00.000+07:00');
      const endDate = new Date(today + 'T23:59:59.999+07:00');

      const { data, error } = await supabase
        .from('attendances')
        .select('*')
        .eq('nim', nim)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;

      setTodayAttendance(data && data.length > 0 ? data[0] : null);
    } catch (error) {
      console.error('Error checking today attendance:', error);
    }
  };

  // Real-time updates
  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('attendances-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendances'
        },
        (payload) => {
          fetchTodayAttendances();
          if (userNIM) {
            checkTodayAttendance(userNIM);
          }
        }
      )
      .subscribe();

    return subscription;
  };

  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    fetchTodayAttendances();
    
    const subscription = setupRealtimeSubscription();

    return () => {
      clearTimeout(splashTimer);
      subscription.unsubscribe();
    };
  }, [userNIM]);

  const handleAttendanceAdded = (newAttendance) => {
    setAttendances(prev => [newAttendance, ...prev]);
    setUserNIM(newAttendance.nim);
    checkTodayAttendance(newAttendance.nim);
  };

  // Format tanggal hari ini
  const getTodayDisplay = () => {
    const today = new Date();
    return today.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Jakarta'
    });
  };

  return (
    <>
      <SplashScreen isVisible={showSplash} />
      <Toaster position="top-right" />

      
      <div className={`min-h-screen bg-gray-50 py-6 px-4 ${showSplash ? 'hidden' : 'block'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Users className="text-white w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800">Absen Kelaz A</h1>
            </div>
            
      Kelaz<div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow border border-gray-200 mb-4">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">{getTodayDisplay()}</span>
            </div>

            <p className="text-gray-600">Presensi Kelas A</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 sticky top-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Form Presensi
                </h2>
                
                {todayAttendance && userNIM && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 text-sm font-medium">
                      ✅ Sudah absen hari ini
                    </p>
                    <p className="text-green-700 text-xs">
                      {new Date(todayAttendance.created_at).toLocaleTimeString('id-ID', {
                        timeZone: 'Asia/Jakarta'
                      })}
                    </p>
                  </div>
                )}

                <AttendanceForm onAttendanceAdded={handleAttendanceAdded} />
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Data Presensi Hari Ini</h2>
                    {!isLoading && (
                      <p className="text-gray-600 text-sm mt-1">
                        {attendances.length} data ditemukan • Terakhir update: {new Date().toLocaleTimeString('id-ID')}
                      </p>
                    )}
                  </div>
                  
                  <PDFExportButton 
                    attendances={attendances} 
                    filterDate={today}
                  />
                </div>

                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-gray-600 text-sm">Memuat data presensi...</p>
                  </div>
                ) : (
                  <AttendanceList attendances={attendances} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
