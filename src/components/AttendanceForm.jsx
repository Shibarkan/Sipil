import React, { useState, useEffect } from 'react';
import { Camera, User, MapPin, Calendar, IdCard, Users, Navigation } from 'lucide-react';

const AttendanceForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    nim: '',
    kelas: '',
    location: '',
    department: '',
    notes: '',
    image: null
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');

  // Auto-get location on component mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation tidak didukung di browser ini');
      return;
    }

    setIsGettingLocation(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Try to get address from coordinates
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=id`
          );
          const data = await response.json();
          
          const locationString = data.locality 
            ? `${data.locality}, ${data.city || data.principalSubdivision} (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
            : `Lat: ${latitude.toFixed(4)}, Long: ${longitude.toFixed(4)}`;
          
          setFormData(prev => ({ 
            ...prev, 
            location: locationString,
            coordinates: { latitude, longitude }
          }));
        } catch (error) {
          // If reverse geocoding fails, just use coordinates
          setFormData(prev => ({ 
            ...prev, 
            location: `Lat: ${latitude.toFixed(4)}, Long: ${longitude.toFixed(4)}`,
            coordinates: { latitude, longitude }
          }));
        }
        
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setLocationError('Gagal mendapatkan lokasi. Pastikan izin lokasi diberikan.');
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file maksimal 5MB!');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.nim.trim()) {
      alert('Nama dan NIM harus diisi!');
      return;
    }
    
    const submissionData = {
      ...formData,
      timestamp: new Date().toLocaleString('id-ID'),
      date: new Date().toISOString().split('T')[0]
    };
    
    onSubmit(submissionData);
    
    // Reset form but keep location
    const currentLocation = formData.location;
    setFormData({
      name: '',
      nim: '',
      kelas: '',
      location: currentLocation, // Keep location
      department: '',
      notes: '',
      image: null
    });
    setImagePreview(null);
    
    alert('Presensi berhasil disimpan! ✅');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nama */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <User className="w-4 h-4" />
          Nama Lengkap *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          placeholder="Masukkan nama lengkap"
          required
        />
      </div>

      {/* NIM */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <IdCard className="w-4 h-4" />
          NIM *
        </label>
        <input
          type="text"
          value={formData.nim}
          onChange={(e) => setFormData(prev => ({ ...prev, nim: e.target.value }))}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          placeholder="Masukkan NIM"
          required
        />
      </div>

      {/* Kelas */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Kelas *
        </label>
        <select
          value={formData.kelas}
          onChange={(e) => setFormData(prev => ({ ...prev, kelas: e.target.value }))}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          required
        >
          <option value="">Pilih Kelas</option>
          <option value="A">Kelas A</option>
          <option value="B">Kelas B</option>
          <option value="C">Kelas C</option>
          <option value="D">Kelas D</option>
          <option value="E">Kelas E</option>
          <option value="F">Kelas F</option>
        </select>
      </div>

      {/* Lokasi Otomatis */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Lokasi Presensi
        </label>
        
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.location || 'Mendeteksi lokasi...'}
              readOnly
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50"
              placeholder="Tekan tombol untuk mendapatkan lokasi"
            />
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
            >
              <Navigation className={`w-4 h-4 ${isGettingLocation ? 'animate-spin' : ''}`} />
              {isGettingLocation ? '...' : '📍'}
            </button>
          </div>
          
          {isGettingLocation && (
            <p className="text-sm text-blue-600 flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              Mendeteksi lokasi...
            </p>
          )}
          
          {locationError && (
            <p className="text-sm text-red-600">{locationError}</p>
          )}
        </div>
      </div>

      {/* Upload Gambar Besar */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Camera className="w-4 h-4" />
          Foto Presensi (Selfie/Bukti Kehadiran)
        </label>
        
        {imagePreview ? (
          <div className="space-y-3 animate-fade-in">
            <div className="relative">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-full h-64 object-cover rounded-xl border-4 border-green-500 shadow-lg"
              />
              <div className="absolute bottom-3 left-3 bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg text-sm">
                ✅ Foto siap diupload
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setImagePreview(null);
                  setFormData(prev => ({ ...prev, image: null }));
                }}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors duration-200"
              >
                Hapus Foto
              </button>
              <label className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 text-center cursor-pointer">
                Ganti Foto
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  capture="environment"
                />
              </label>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-blue-50 group">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Camera className="w-12 h-12 text-gray-400 mb-3 group-hover:text-blue-500 transition-colors duration-200" />
              <p className="text-lg font-medium text-gray-600 mb-1">Ambil Foto</p>
              <p className="text-sm text-gray-500 text-center">
                Klik untuk mengambil foto selfie<br />
                <span className="text-xs">atau upload dari galeri</span>
              </p>
            </div>
            <input 
              type="file" 
              className="hidden" 
              accept="image/*"
              onChange={handleImageUpload}
              capture="environment"
            />
          </label>
        )}
        
        <p className="text-xs text-gray-500 mt-2">
          📷 Disarankan selfie dengan wajah jelas dan background yang menunjukkan lokasi
        </p>
      </div>

      {/* Department/Optional */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mata Kuliah / Program
        </label>
        <select
          value={formData.department}
          onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        >
          <option value="">Pilih Mata Kuliah</option>
          <option value="Pemrograman Web">Pemrograman Web</option>
          <option value="Basis Data">Basis Data</option>
          <option value="Algoritma">Algoritma</option>
          <option value="Jaringan Komputer">Jaringan Komputer</option>
          <option value="Mobile Development">Mobile Development</option>
          <option value="Lainnya">Lainnya</option>
        </select>
      </div>

      {/* Catatan */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Catatan / Keterangan Tambahan
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows="3"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          placeholder="Contoh: Sakit, Izin, atau keterangan lain..."
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        disabled={!formData.name || !formData.nim || !formData.kelas}
      >
        📝 Simpan Presensi
      </button>
    </form>
  );
};

export default AttendanceForm;