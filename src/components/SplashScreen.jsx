import React from 'react';

const SplashScreen = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="text-center">
        {/* Logo/Icon Area */}
        <div className="w-24 h-24 mx-auto mb-6 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
          {/* Ganti dengan logo asli nanti */}
          {/* Atau gunakan gambar: */}
           <img 
            src="https://i.pinimg.com/736x/d9/ad/3d/d9ad3d0aa13b18ff298a9fd63b7fde5e.jpg" 
            alt="Digital Presensi Logo" 
            className="w-16 h-16 object-contain"
          /> 
        </div>
        
        {/* App Name */}
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Digital Presensi
        </h1>
        
        {/* Loading Animation */}
        <div className="flex justify-center items-center gap-2 mt-6">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        
        <p className="text-gray-600 text-sm mt-4">Memuat aplikasi...</p>
      </div>
    </div>
  );
};

export default SplashScreen;