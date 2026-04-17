import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

interface AuthModalProps {
  onClose: () => void;
  onLogin: (user: any) => void;
}

export function AuthModal({ onClose, onLogin }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        onLogin({
          id: userCredential.user.uid,
          name: userCredential.user.displayName || 'Usuario',
          email: userCredential.user.email,
          photoUrl: userCredential.user.photoURL
        });
      } else {
        if (!name.trim()) {
          throw new Error('El nombre es obligatorio.');
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        
        onLogin({
          id: userCredential.user.uid,
          name: name,
          email: userCredential.user.email,
          photoUrl: null
        });
      }
    } catch (err: any) {
      if (err.message === 'El nombre es obligatorio.') {
        setError(err.message);
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Ese correo ya está registrado.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Correo o contraseña incorrectos.');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('El proveedor de correo/contraseña no está habilitado. Habilítalo en Firebase Console.');
      } else {
        console.error('Error detallado de autenticación:', err);
        setError(err.message || 'Ocurrió un error en la autenticación.');
      }
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
        
        <h3 className="text-2xl font-black mb-2 text-zinc-900">{isLogin ? 'Iniciar Sesión' : 'Crea tu Cuenta'}</h3>
        <p className="text-zinc-500 text-sm mb-6">
          {isLogin ? 'Accede a tus reservas y preferencias.' : 'Regístrate para agendar clases.'}
        </p>

        {error && <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm mb-4 font-medium">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Nombre Completo</label>
              <input 
                type="text" 
                required 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow" 
                placeholder="Juan Pérez" 
              />
            </div>
          )}
          
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Correo Electrónico</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow" 
              placeholder="juan@ejemplo.com" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Contraseña</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow" 
              placeholder="••••••••" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-green-500 text-white font-bold py-4 rounded-xl hover:bg-green-600 transition-colors mt-2 disabled:opacity-50"
          >
            {loading ? 'Cargando...' : (isLogin ? 'Ingresar' : 'Registrarse')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm font-medium text-zinc-500">
          {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
          <button 
            type="button" 
            onClick={() => { setIsLogin(!isLogin); setError(''); }} 
            className="ml-2 text-green-600 font-bold hover:underline"
          >
            {isLogin ? 'Regístrate aquí' : 'Inicia Sesión'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
