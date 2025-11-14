import React from "react";
import { FiUpload, FiX, FiImage } from "react-icons/fi";

interface LogoUploaderProps {
  src?: string;
  onUpload: (url: string) => void;
}

export default function LogoUploader({ src, onUpload }: LogoUploaderProps) {
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (file.size > 5 * 1024 * 1024) {
      alert("File too large. Max 5MB.");
      return;
    }

    setUploading(true);
    // Simulate upload
    setTimeout(() => {
      const fakeUrl = URL.createObjectURL(file);
      onUpload(fakeUrl);
      setUploading(false);
    }, 1000);
  };

  return (
    <div className="relative">
      <div
        className="w-28 h-28 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-teal-500 transition-colors overflow-hidden bg-gray-50"
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? (
          <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
        ) : src ? (
          <img src={src} alt="Store logo" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center">
            <FiImage size={24} className="mx-auto text-gray-400 mb-1" />
            <p className="text-xs text-gray-500">Upload</p>
          </div>
        )}
      </div>

      {src && !uploading && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUpload("");
          }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
        >
          <FiX size={14} />
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <p className="text-xs text-gray-500 mt-2 text-center">Max 5MB</p>
    </div>
  );
}
