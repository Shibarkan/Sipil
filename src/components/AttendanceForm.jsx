import React, { useState, useEffect } from 'react';
import { Camera, Upload, Navigation } from 'lucide-react';
import { supabase } from '../lib/supabase';

const AttendanceForm = ({ onAttendanceAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    nim: '',
    kelas: 'A',
    location: '',
    image: null,
    coordinates: null,
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAttendedToday, setHasAttendedToday] = useState(false);

  // ===== AUTO-DETECT LOKASI =====
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Browser tidak mendukung geolocation.');
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=id`
          );
          const data = await response.json();

          const locationString = data.locality
            ? `${data.locality}, ${data.city || data.principalSubdivision}`
            : `Lat: ${latitude.toFixed(4)}, Long: ${longitude.toFixed(4)}`;

          setFormData((prev) => ({
            ...prev,
            location: locationString,
            coordinates: { latitude, longitude },
          }));
        } catch (err) {
          console.error('Gagal mendapatkan alamat:', err);
        } finally {
          setIsGettingLocation(false);
        }
      },
      () => {
        alert('Tidak dapat mendeteksi lokasi.');
        setIsGettingLocation(false);
      }
    );
  };

  // ===== CEK PRESENSI HARI INI =====
  const checkIfAlreadyAttended = async (nim) => {
    if (!nim) return;
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data, error } = await supabase
      .from('attendances')
      .select('*')
      .eq('nim', nim)
      .gte('created_at', today)
      .lt('created_at', tomorrow.toISOString());

    if (!error && data.length > 0) setHasAttendedToday(true);
    else setHasAttendedToday(false);
  };

  useEffect(() => {
    if (formData.nim.trim()) checkIfAlreadyAttended(formData.nim);
  }, [formData.nim]);

  // ===== UPLOAD GAMBAR KE SUPABASE =====
  const uploadImageToSupabase = async (file) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;

      // Upload ke bucket
      const { error: uploadError } = await supabase.storage
        .from('presensi-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Ambil URL publik
      const { data: publicData } = supabase.storage
        .from('presensi-images')
        .getPublicUrl(fileName);

      return publicData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  // ===== HANDLE SUBMIT =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.nim) {
      alert('Nama dan NIM wajib diisi!');
      return;
    }

    if (hasAttendedToday) {
      alert('❌ Anda sudah presensi hari ini!');
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = null;
      if (formData.image) imageUrl = await uploadImageToSupabase(formData.image);

      const { data, error } = await supabase
        .from('attendances')
        .insert([
          {
            name: formData.name,
            nim: formData.nim,
            kelas: formData.kelas,
            location: formData.location,
            coordinates: formData.coordinates,
            image_url: imageUrl,
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) throw error;

      alert('✅ Presensi berhasil disimpan!');
      onAttendanceAdded?.(data[0]);

      setFormData({
        name: '',
        nim: '',
        kelas: 'A',
        location: formData.location,
        image: null,
      });
      setImagePreview(null);
      setHasAttendedToday(true);
    } catch (error) {
      alert('❌ Gagal menyimpan presensi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ===== HANDLE FOTO =====
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setFormData((prev) => ({ ...prev, image: file }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* NAMA */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nama Lengkap *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Masukkan nama lengkap"
          required
        />
      </div>

      {/* NIM */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          NIM *
        </label>
        <input
          type="text"
          value={formData.nim}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, nim: e.target.value }))
          }
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 ${
            hasAttendedToday
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
          placeholder="Masukkan NIM"
          required
        />
        {hasAttendedToday && (
          <p className="text-red-500 text-xs mt-1">
            ❌ Anda sudah presensi hari ini
          </p>
        )}
      </div>

      {/* LOKASI */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Lokasi
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={formData.location || 'Mendeteksi lokasi...'}
            readOnly
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
          />
          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Navigation className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* FOTO */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Foto Presensi
        </label>
        {imagePreview ? (
          <div className="space-y-2">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-40 object-cover rounded-lg border-2 border-green-500"
            />
            <button
              type="button"
              onClick={() => {
                setImagePreview(null);
                setFormData((prev) => ({ ...prev, image: null }));
              }}
              className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
            >
              Hapus Foto
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 bg-gray-50">
            <Camera className="w-6 h-6 text-gray-400 mb-1" />
            <p className="text-sm text-gray-500">Klik untuk upload foto</p>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
              capture="environment"
            />
          </label>
        )}
      </div>

      {/* BUTTON */}
      <button
        type="submit"
        disabled={
          !formData.name || !formData.nim || isSubmitting || hasAttendedToday
        }
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Menyimpan...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Simpan Presensi
          </>
        )}
      </button>
    </form>
  );
};

export default AttendanceForm;
