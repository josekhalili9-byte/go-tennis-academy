import React, { useRef } from 'react';
import { Pencil } from 'lucide-react';

interface EditableImageProps {
  isAdmin: boolean;
  src: string;
  onChange: (newSrc: string) => void;
  className?: string;
  alt?: string;
}

export function EditableImage({ isAdmin, src, onChange, className = '', alt = '' }: EditableImageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Comprimir a JPEG con 80% calidad para que no ocupe mucho espacio en memoria
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        onChange(dataUrl);

        // Resetear input para poder subir la misma imagen 2 veces si se quiere
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  if (!isAdmin) {
    return <img src={src} className={className} alt={alt} />;
  }

  return (
    <div className={`relative group ${className}`}>
      <img src={src} className="w-full h-full object-cover" alt={alt} />
      
      <button
        onClick={() => fileInputRef.current?.click()}
        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white rounded-inherit"
        title="Cambiar imagen"
      >
        <Pencil size={32} />
      </button>

      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />
    </div>
  );
}
