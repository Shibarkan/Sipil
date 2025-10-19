import React, { useState, useRef } from 'react';
import { Camera, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';

const AttendanceForm = ({ onAttendanceAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    nim: '',
    asal: '',
    kelas: 'A',
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [kegiatan, setKegiatan] = useState('chant'); // chant atau dies
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Camera refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Upload foto ke Supabase
  const uploadImageToSupabase = async (file) => {
    if (!file) return null;
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage
      .from('presensi-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: true });
    if (error) throw error;

    const { data } = supabase.storage.from('presensi-images').getPublicUrl(fileName);
    return data.publicUrl;
  };

  // Handle upload file
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5MB');
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  // Camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsCameraActive(true);
    } catch {
      alert('Tidak dapat mengakses kamera.');
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(blob));
      stopCamera();
    });
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    setIsCameraActive(false);
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.nim || !formData.asal) {
      alert('Nama, NIM, dan Asal wajib diisi!');
      return;
    }
    if (!photoFile) {
      alert('Silakan upload/ambil foto terlebih dahulu!');
      return;
    }

    setIsSubmitting(true);
    try {
      const uploadedUrl = await uploadImageToSupabase(photoFile);

      // Cek apakah mahasiswa sudah absen untuk kegiatan hari ini
      const { data: existing, error: fetchError } = await supabase
        .from('attendances')
        .select('*')
        .eq('nim', formData.nim.trim())
        .maybeSingle();

      if (fetchError) throw fetchError;

      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

      if (existing && new Date(existing.created_at).toISOString().slice(0, 10) === today) {
        // Mahasiswa sudah ada hari ini → update foto sesuai kegiatan
        const updateData = kegiatan === 'chant' ? { foto_ch: uploadedUrl } : { foto_dies: uploadedUrl };
        const { error: updateError } = await supabase
          .from('attendances')
          .update(updateData)
          .eq('id', existing.id);
        if (updateError) throw updateError;

        alert(`✅ Presensi ${kegiatan === 'chant' ? 'Chant Class' : 'Dies Natalis'} berhasil diupdate!`);
        onAttendanceAdded?.({ ...existing, ...updateData });
      } else {
        // Buat data baru
        const insertData = {
          name: formData.name,
          nim: formData.nim,
          asal: formData.asal,
          kelas: formData.kelas,
          ...(kegiatan === 'chant' ? { foto_ch: uploadedUrl } : { foto_dies: uploadedUrl }),
        };
        const { data: newData, error: insertError } = await supabase.from('attendances').insert([insertData]).select();
        if (insertError) throw insertError;

        alert('✅ Presensi berhasil disimpan!');
        onAttendanceAdded?.(newData[0]);
      }

      // Reset form
      setFormData({ name: '', nim: '', asal: '', kelas: 'A' });
      setPhotoFile(null);
      setPhotoPreview(null);
      setKegiatan('chant');
    } catch (err) {
      console.error(err);
      alert('❌ Gagal menyimpan presensi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nama */}
      <div>
        <label className="block text-sm font-medium">Nama Lengkap *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
          required
        />
      </div>

      {/* NIM */}
      <div>
        <label className="block text-sm font-medium">NIM *</label>
        <input
          type="text"
          value={formData.nim}
          onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
          required
        />
      </div>

      {/* Asal */}
      <div>
        <label className="block text-sm font-medium">Asal Daerah *</label>
        <input
          type="text"
          value={formData.asal}
          onChange={(e) => setFormData({ ...formData, asal: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
          required
        />
      </div>

      {/* Kelas */}
      <div>
        <label className="block text-sm font-medium">Kelas</label>
        <input
          type="text"
          value={formData.kelas}
          readOnly
          className="w-full px-3 py-2 border bg-gray-100 rounded-lg"
        />
      </div>

      {/* Upload / Camera */}
      <div>
        <label className="block text-sm font-medium mb-1">📸 Foto Bukti</label>
        {photoPreview ? (
          <div className="space-y-2">
            <img src={photoPreview} alt="Preview" className="w-full h-40 object-cover rounded-lg border" />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setPhotoFile(null);
                  setPhotoPreview(null);
                }}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg"
              >
                Hapus Foto
              </button>
              <button type="button" onClick={startCamera} className="flex-1 bg-gray-200 py-2 rounded-lg">
                Ambil Ulang
              </button>
            </div>
          </div>
        ) : isCameraActive ? (
          <div className="space-y-2">
            <video ref={videoRef} autoPlay playsInline className="w-full h-40 rounded-lg bg-black" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex gap-2">
              <button type="button" onClick={capturePhoto} className="flex-1 bg-green-600 text-white py-2 rounded-lg">
                Ambil Foto
              </button>
              <button type="button" onClick={stopCamera} className="flex-1 bg-gray-400 text-white py-2 rounded-lg">
                Batal
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50">
              <Upload className="w-6 h-6 text-gray-400 mb-1" />
              <p className="text-sm text-gray-500">Upload Foto</p>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
            <button type="button" onClick={startCamera} className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg bg-gray-50">
              <Camera className="w-6 h-6 text-gray-400 mb-1" />
              <p className="text-sm text-gray-500">Ambil Selfie</p>
            </button>
          </div>
        )}
      </div>

      {/* Kegiatan */}
      <div>
        <label className="block text-sm font-medium mb-1">Kegiatan *</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input type="radio" name="kegiatan" value="chant" checked={kegiatan === 'chant'} onChange={() => setKegiatan('chant')} />
            <span>Chant Class (CH)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="kegiatan" value="dies" checked={kegiatan === 'dies'} onChange={() => setKegiatan('dies')} />
            <span>Dies Natalis</span>
          </label>
        </div>
      </div>

      <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-3 rounded-lg">
        {isSubmitting ? 'Menyimpan...' : 'Simpan Presensi'}
      </button>
    </form>
  );
};

export default AttendanceForm;
