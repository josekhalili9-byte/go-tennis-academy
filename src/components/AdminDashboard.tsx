import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Users, Calendar, Trash2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, onSnapshot, deleteDoc, doc } from 'firebase/firestore';

interface AdminDashboardProps {
  onClose: () => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

export function AdminDashboard({ onClose, showToast }: AdminDashboardProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'usuarios' | 'reservas'>('usuarios');

  useEffect(() => {
    const unsubUsers = onSnapshot(query(collection(db, 'users')), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
    });

    const unsubRes = onSnapshot(query(collection(db, 'reservations')), (snapshot) => {
      const resData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      // Sort reservations by date descending
      resData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setReservations(resData);
    });

    return () => {
      unsubUsers();
      unsubRes();
    };
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <motion.div initial={{ y: 50, scale: 0.95 }} animate={{ y: 0, scale: 1 }} className="bg-zinc-50 w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
        <div className="bg-zinc-900 text-white p-6 flex justify-between items-center">
          <h2 className="text-2xl font-black flex items-center gap-2">Panel de Administración</h2>
          <button onClick={onClose} className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition"><X size={24} /></button>
        </div>

        <div className="flex border-b border-zinc-200 bg-white">
          <button onClick={() => setActiveTab('usuarios')} className={`flex-1 py-4 font-bold border-b-2 transition flex items-center justify-center gap-2 ${activeTab === 'usuarios' ? 'border-green-500 text-green-600' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}>
            <Users size={20} /> Usuarios Registrados
          </button>
          <button onClick={() => setActiveTab('reservas')} className={`flex-1 py-4 font-bold border-b-2 transition flex items-center justify-center gap-2 ${activeTab === 'reservas' ? 'border-green-500 text-green-600' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}>
            <Calendar size={20} /> Todas las Reservas
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'usuarios' && (
            <div className="animate-in fade-in space-y-4">
              {users.length === 0 ? (
                <div className="text-center p-8 text-zinc-500">No hay usuarios registrados en Firestore. (Nota: Los usuarios deben iniciar sesión y guardar preferencias o reservas para aparecer aquí)</div>
              ) : (
                <div className="grid gap-4">
                  {users.map(u => (
                    <div key={u.id} className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
                       <div className="flex justify-between items-start mb-4">
                         <div>
                           <div className="font-bold text-lg text-zinc-900">{u.name}</div>
                           <div className="text-sm text-zinc-500">{u.email}</div>
                           <div className="text-xs text-zinc-400 mt-1">ID: {u.id}</div>
                           {u.preferences && <div className="text-sm bg-zinc-100 mt-2 p-2 rounded-lg inline-block">Nivel preferido: <span className="font-bold">{u.preferences.level}</span></div>}
                         </div>
                         <button 
                           onClick={async () => {
                             if(confirm(`¿Estás seguro de eliminar el registro y todas las reservas del usuario ${u.name}?`)) {
                               try {
                                 // Delete user document
                                 await deleteDoc(doc(db, 'users', u.id));
                                 // Delete user's reservations
                                 const userReservations = reservations.filter(r => r.userId === u.id);
                                 for (const r of userReservations) {
                                   await deleteDoc(doc(db, 'reservations', r.id));
                                 }
                                 showToast(`Usuario ${u.name} y sus reservas eliminados`, 'success');
                               } catch(err) {
                                 console.error(err);
                                 showToast('Error al eliminar usuario', 'error');
                               }
                             }
                           }}
                           className="text-zinc-400 hover:text-red-500 p-2 bg-zinc-50 hover:bg-red-50 rounded-lg transition"
                           title="Eliminar usuario y sus reservas"
                         >
                           <Trash2 size={20} />
                         </button>
                       </div>
                       
                       <div className="border-t border-zinc-100 pt-4 mt-2">
                         <h4 className="font-bold text-zinc-900 mb-2">Próximas Reservas de este usuario:</h4>
                         {reservations.filter(r => r.userId === u.id).length > 0 ? (
                           <ul className="space-y-2">
                             {reservations.filter(r => r.userId === u.id).map(r => (
                               <li key={r.id} className="text-sm flex gap-4 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                                 <span className="font-bold">{r.date}</span>
                                 <span className="text-zinc-600">{r.time} ({r.level})</span>
                               </li>
                             ))}
                           </ul>
                         ) : (
                           <p className="text-sm text-zinc-500">Sin reservas próximas.</p>
                         )}
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reservas' && (
            <div className="animate-in fade-in space-y-4">
              {reservations.length === 0 ? (
                <div className="text-center p-8 text-zinc-500">No hay reservas registradas.</div>
              ) : (
                <table className="w-full text-left bg-white rounded-2xl overflow-hidden shadow-sm border border-zinc-200">
                   <thead className="bg-zinc-100 text-zinc-500 text-xs uppercase tracking-wider">
                     <tr>
                       <th className="p-4">Fecha y Hora</th>
                       <th className="p-4">Usuario</th>
                       <th className="p-4">Nivel</th>
                       <th className="p-4 text-right">Acciones</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-zinc-100">
                     {reservations.map((r: any) => (
                       <tr key={r.id} className="hover:bg-zinc-50 transition">
                         <td className="p-4 font-bold text-zinc-900">{r.date} <span className="text-green-600 ml-2">{r.time}</span></td>
                         <td className="p-4 text-zinc-600">{r.name}</td>
                         <td className="p-4 text-zinc-600">{r.level}</td>
                         <td className="p-4 text-right">
                           <button onClick={async () => {
                             if(confirm('¿Eliminar reserva de ' + r.name + '?')) {
                               try { await deleteDoc(doc(db, 'reservations', r.id)); showToast('Reserva eliminada', 'success'); }
                               catch(err) { showToast('Error al eliminar', 'error'); }
                             }
                           }} className="text-zinc-400 hover:text-red-500 p-2"><Trash2 size={18} /></button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
