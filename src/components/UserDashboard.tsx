import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Calendar, CreditCard, Settings, User, LogOut } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { db } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

interface UserDashboardProps {
  user: any;
  reservations: any[];
  onClose: () => void;
  onLogout: () => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export function UserDashboard({ user, reservations, onClose, onLogout, showToast }: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState<'reservas' | 'pagos' | 'preferencias'>('reservas');
  
  const userReservations = reservations.filter(r => r.userId === user.id);
  const [prefs, setPrefs] = useState({ level: 'Principiante', notifications: true });
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!user || !user.id) return;
    const unsub = onSnapshot(doc(db, 'users', user.id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.preferences) setPrefs(data.preferences);
        if (data.paymentHistory) setPaymentHistory(data.paymentHistory);
      }
    });
    return () => unsub();
  }, [user]);

  const savePreferences = async () => {
    try {
      await setDoc(doc(db, 'users', user.id), { preferences: prefs }, { merge: true });
      if (showToast) showToast('Preferencias guardadas exitosamente', 'success');
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Error guardando preferencias', 'error');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-8">
      <motion.div initial={{ y: 50, scale: 0.95 }} animate={{ y: 0, scale: 1 }} className="bg-white rounded-3xl w-full max-w-4xl max-h-full shadow-2xl flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Sidebar Nav */}
        <div className="bg-zinc-900 text-white w-full md:w-64 flex-shrink-0 p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center font-bold text-xl">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold truncate max-w-[150px]">{user.name}</h3>
              <p className="text-zinc-400 text-xs">Alumno</p>
            </div>
          </div>

          <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible">
            <button 
              onClick={() => setActiveTab('reservas')}
              className={`flex items-center gap-3 p-3 rounded-xl transition ${activeTab === 'reservas' ? 'bg-green-600 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
            >
              <Calendar size={20} /> <span className="font-medium">Mis Clases</span>
            </button>
            <button 
              onClick={() => setActiveTab('pagos')}
              className={`flex items-center gap-3 p-3 rounded-xl transition ${activeTab === 'pagos' ? 'bg-green-600 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
            >
              <CreditCard size={20} /> <span className="font-medium">Historial de Pagos</span>
            </button>
            <button 
              onClick={() => setActiveTab('preferencias')}
              className={`flex items-center gap-3 p-3 rounded-xl transition ${activeTab === 'preferencias' ? 'bg-green-600 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
            >
              <Settings size={20} /> <span className="font-medium">Preferencias</span>
            </button>
          </nav>

          <div className="mt-auto pt-8 border-t border-zinc-800 flex justify-between">
             <button onClick={onLogout} className="flex items-center gap-2 text-zinc-400 hover:text-red-400 transition text-sm">
               <LogOut size={16} /> Cerrar sesión
             </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 overflow-y-auto relative bg-zinc-50">
          <button onClick={onClose} className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900 bg-white shadow-sm p-2 rounded-full border border-zinc-200">
            <X size={20} />
          </button>

          {activeTab === 'reservas' && (
            <div className="animate-in fade-in">
              <h2 className="text-3xl font-black mb-8 text-zinc-900">Mis Próximas Clases</h2>
              {userReservations.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-dashed border-zinc-300 text-center text-zinc-500">
                  No tienes clases programadas.
                </div>
              ) : (
                <div className="space-y-4">
                  {userReservations.map((res, i) => {
                    const dateObj = parseISO(res.date);
                    return (
                    <div key={i} className="bg-white p-5 rounded-2xl border border-zinc-200 flex items-center gap-6 shadow-sm">
                      <div className="bg-green-100 text-green-700 w-20 h-20 rounded-xl flex flex-col items-center justify-center shrink-0">
                         <span className="font-black text-2xl">{format(dateObj, 'd')}</span>
                         <span className="text-xs font-bold uppercase">{format(dateObj, 'MMM', { locale: es })}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-zinc-900">Clase de Tenis ({res.level})</h4>
                        <div className="flex items-center gap-4 text-zinc-500 mt-2 text-sm font-medium">
                           <span className="flex items-center gap-1"><Calendar size={16} /> {format(dateObj, 'EEEE', { locale: es })}</span>
                           <span className="flex items-center gap-1"><User size={16} /> {res.time} hs</span>
                        </div>
                      </div>
                      <div className="hidden sm:block">
                        <span className="bg-zinc-100 text-zinc-600 px-3 py-1 rounded-lg text-xs font-bold uppercase">Confirmada</span>
                      </div>
                    </div>
                  )})}
                </div>
              )}
            </div>
          )}

          {activeTab === 'pagos' && (
            <div className="animate-in fade-in">
              <h2 className="text-3xl font-black mb-8 text-zinc-900">Historial de Pagos</h2>
              {paymentHistory && paymentHistory.length > 0 ? (
                <table className="w-full text-left">
                   <thead>
                     <tr className="text-zinc-500 uppercase text-xs tracking-wider border-b border-zinc-200">
                       <th className="pb-3">Fecha</th>
                       <th className="pb-3">Concepto</th>
                       <th className="pb-3 text-right">Monto</th>
                       <th className="pb-3 text-right">Estado</th>
                     </tr>
                   </thead>
                   <tbody>
                     {paymentHistory.map((p: any, i: number) => (
                       <tr key={i} className="border-b border-zinc-100 font-medium">
                         <td className="py-4">{p.date}</td>
                         <td className="py-4 text-zinc-900">{p.description}</td>
                         <td className="py-4 text-right">${p.amount} MXN</td>
                         <td className="py-4 text-right"><span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold uppercase">Completado</span></td>
                       </tr>
                     ))}
                   </tbody>
                </table>
              ) : (
                <div className="bg-white p-8 rounded-2xl border border-dashed border-zinc-300 text-center text-zinc-500">
                  No hay pagos registrados.
                </div>
              )}
            </div>
          )}

          {activeTab === 'preferencias' && (
            <div className="animate-in fade-in max-w-md">
              <h2 className="text-3xl font-black mb-8 text-zinc-900">Preferencias de Cuenta</h2>
              <div className="bg-white p-6 rounded-2xl border border-zinc-200 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-zinc-500 mb-2 uppercase tracking-wider">Tu Nivel de Juego</label>
                  <select 
                    value={prefs.level} 
                    onChange={e => setPrefs({...prefs, level: e.target.value})}
                    className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 ring-green-500 font-medium"
                  >
                    <option>Principiante</option>
                    <option>Intermedio</option>
                    <option>Avanzado</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="notifs" 
                    checked={prefs.notifications}
                    onChange={e => setPrefs({...prefs, notifications: e.target.checked})}
                    className="w-5 h-5 text-green-600 bg-zinc-100 border-zinc-300 rounded focus:ring-green-500" 
                  />
                  <label htmlFor="notifs" className="font-medium text-zinc-700">
                    Recibir recordatorios de mis clases por correo
                  </label>
                </div>

                <button 
                  onClick={savePreferences}
                  className="w-full bg-zinc-900 text-white font-bold py-3 rounded-xl hover:bg-green-600 transition-colors mt-4"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
