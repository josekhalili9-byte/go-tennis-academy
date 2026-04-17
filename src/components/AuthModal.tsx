import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { auth, loginWithGoogle } from '../firebase';

interface AuthModalProps {
  onClose: () => void;
  onLogin: (user: any) => void;
}

export function AuthModal({ onClose, onLogin }: AuthModalProps) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      const result = await loginWithGoogle();
      const user = result.user;
      onLogin({
        id: user.uid,
        name: user.displayName || 'Usuario',
        email: user.email,
        photoUrl: user.photoURL
      });
    } catch (err: any) {
      console.error(err);
      setError('Error al iniciar sesión con Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <motion.div initial={{ y: 50, scale: 0.95 }} animate={{ y: 0, scale: 1 }} className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 bg-zinc-100 rounded-full p-2">
          <X size={20} />
        </button>
        
        <h3 className="text-2xl font-black mb-2 text-zinc-900">Iniciar Sesión</h3>
        <p className="text-zinc-500 text-sm mb-6">Usa tu cuenta de Google para agendar clases y gestionar reservas.</p>
        
        {error && <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm mb-4 font-medium">{error}</div>}
        
        <button 
          onClick={handleGoogleLogin} 
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-zinc-200 text-zinc-900 font-bold py-4 rounded-xl hover:bg-zinc-50 hover:border-zinc-300 transition-colors disabled:opacity-50"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
          {loading ? 'Cargando...' : 'Continuar con Google'}
        </button>
      </motion.div>
    </motion.div>
  );
}
