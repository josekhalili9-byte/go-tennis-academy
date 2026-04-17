import React, { useState, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { defaultContent } from './data/defaultContent';
import { EditableText } from './components/EditableText';
import { EditableImage } from './components/EditableImage';
import { InteractiveCalendar } from './components/InteractiveCalendar';
import { AuthModal } from './components/AuthModal';
import { UserDashboard } from './components/UserDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { MapPin, Phone, Clock, Plus, Trash2, Menu, X, CheckCircle, Navigation, Award, Users, User, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { db, auth, logoutUser } from './firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, arrayUnion } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function App() {
  const [content, setContent] = useLocalStorage('go-tennis-content', defaultContent);
  const [reservations, setReservations] = useState<any[]>([]);
  
  // User Management
  const [users, setUsers] = useState<any[]>([]); // Optional, might drop later if not needed
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserDashboard, setShowUserDashboard] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser((prev: any) => {
          if (prev && prev.id === user.uid && prev.name !== 'Usuario') {
            return prev;
          }
          return {
            id: user.uid,
            name: user.displayName || 'Usuario',
            email: user.email,
            photoUrl: user.photoURL
          };
        });
        
        // El upsert a firestore ahora se maneja principlamente en handleLogin
        // para garantizar que tenemos el nombre completo.
      } else {
        setCurrentUser(null);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;
    // Subscribe to reservations
    const q = query(collection(db, 'reservations'));
    const unsubscribeRes = onSnapshot(q, (snapshot) => {
      const resData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReservations(resData);
    });

    return () => {
      unsubscribeRes();
    };
  }, [isAuthReady]);

  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [toast, setToast] = useState<{message: string, type: 'error' | 'success'} | null>(null);
  const [reservationToDelete, setReservationToDelete] = useState<string | null>(null);
  
  const showToast = (message: string, type: 'error' | 'success' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Reservation Form State
  const [resForm, setResForm] = useState<{date: Date | null, time: string, level: string}>({ date: null, time: '', level: 'Principiante' });
  const [resSuccess, setResSuccess] = useState(false);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === '8718') {
      setIsAdmin(true);
      setShowAdminModal(false);
      setAdminPassword('');
      showToast('Sesión de Admin iniciada', 'success');
    } else {
      showToast('Contraseña incorrecta', 'error');
    }
  };

  const updateContent = (section: keyof typeof content, key: string, value: any) => {
    setContent((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const handleReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('Por favor, inicia sesión para reservar.', 'error');
      setShowAuthModal(true);
      return;
    }
    if (!resForm.date || !resForm.time) {
      showToast('Por favor, selecciona una fecha y horario.', 'error');
      return;
    }

    const dateStr = format(resForm.date, 'yyyy-MM-dd');
    const newReservation = { 
      userId: currentUser.id,
      name: currentUser.name,
      level: resForm.level,
      date: dateStr,
      day: dateStr, 
      time: resForm.time,
      status: 'Confirmada',
      createdAt: new Date().toISOString()
    };

    try {
      const resId = `res_${Date.now()}`;
      await setDoc(doc(db, 'reservations', resId), newReservation);
      
      // Add mock payment record
      await setDoc(doc(db, 'users', currentUser.id), {
        paymentHistory: arrayUnion({
          date: dateStr,
          description: `Clase de Tenis (${resForm.level})`,
          amount: 250
        })
      }, { merge: true });

      setResSuccess(true);
      setResForm({ date: null, time: '', level: 'Principiante' });
      setTimeout(() => setResSuccess(false), 3000);
    } catch (err) {
      console.error('Error al guardar reserva', err);
      showToast('Ocurrió un error al procesar tu reserva.', 'error');
    }
  };

  const handleLogin = async (user: any) => {
    setCurrentUser(user);
    setShowAuthModal(false);
    
    try {
      await setDoc(doc(db, 'users', user.id), {
        id: user.id,
        name: user.name,
        email: user.email
      }, { merge: true });
    } catch (e) {
      console.error("Error al registrar usuario en db", e);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setShowUserDashboard(false);
    showToast('Sesión cerrada correctamente', 'success');
  };

  // UI Components helpers
  const HeaderNav = () => (
    <nav className="absolute top-0 w-full z-40 p-4 md:p-6 lg:px-12 flex justify-between items-center text-white">
      <div className="font-bold text-2xl tracking-tighter flex items-center gap-2">
        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
          <div className="w-5 h-5 bg-white rounded-full"></div>
        </div>
        GO TENNIS
      </div>
      
      <div className="hidden md:flex gap-8 items-center font-medium">
        <a href="#inicio" className="hover:text-green-400 transition">Inicio</a>
        <a href="#nosotros" className="hover:text-green-400 transition">Nosotros</a>
        <a href="#servicios" className="hover:text-green-400 transition">Servicios</a>
        <a href="#galeria" className="hover:text-green-400 transition">Galería</a>
        
        {currentUser ? (
          <button onClick={() => setShowUserDashboard(true)} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-full transition">
            <User size={16} /> {currentUser.name.split(' ')[0]}
          </button>
        ) : (
          <button onClick={() => setShowAuthModal(true)} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-full transition">
            <LogIn size={16} /> Ingresar
          </button>
        )}

        <a href="#reservas" className="bg-green-600 hover:bg-green-500 px-6 py-2 rounded-full transition">Reservar</a>
        
        {isAdmin ? (
          <div className="flex items-center gap-4">
            <button onClick={() => setShowAdminDashboard(true)} className="text-zinc-400 text-sm hover:text-white transition">Panel Central</button>
            <button onClick={() => setIsAdmin(false)} className="text-zinc-400 text-sm hover:text-white transition">Salir Admin</button>
          </div>
        ) : (
          <button onClick={() => setShowAdminModal(true)} className="text-zinc-400 text-sm hover:text-white transition">Admin</button>
        )}
      </div>

      <button className="md:hidden text-white border border-zinc-700 rounded-lg p-2" onClick={() => setIsMenuOpen(true)}>
        <Menu size={24} />
      </button>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-zinc-900 z-50 p-6 flex flex-col"
          >
            <div className="flex justify-between items-center text-white mb-12">
              <span className="font-bold text-2xl">GO TENNIS</span>
              <button onClick={() => setIsMenuOpen(false)}><X size={28} /></button>
            </div>
            <div className="flex flex-col gap-6 text-xl text-white">
              {currentUser ? (
                <button onClick={() => { setShowUserDashboard(true); setIsMenuOpen(false); }} className="flex items-center gap-3 w-full bg-zinc-800 p-4 rounded-xl text-left">
                  <User size={24} className="text-green-500" />
                  <div>
                    <div className="font-bold text-sm">Hola, {currentUser.name}</div>
                    <div className="text-xs text-zinc-400">Ver mi cuenta</div>
                  </div>
                </button>
              ) : (
                <button onClick={() => { setShowAuthModal(true); setIsMenuOpen(false); }} className="flex items-center gap-3 w-full bg-zinc-800 p-4 rounded-xl text-left">
                  <LogIn size={24} className="text-zinc-400" />
                  <div className="font-bold text-sm">Iniciar Sesión / Registro</div>
                </button>
              )}

              <a href="#inicio" onClick={() => setIsMenuOpen(false)}>Inicio</a>
              <a href="#nosotros" onClick={() => setIsMenuOpen(false)}>Nosotros</a>
              <a href="#servicios" onClick={() => setIsMenuOpen(false)}>Servicios</a>
              <a href="#reservas" onClick={() => setIsMenuOpen(false)} className="text-green-500 font-bold mt-4">Reservar Clase</a>
              
              <div className="mt-8 border-t border-zinc-800 pt-8 flex flex-col items-start gap-4">
                {isAdmin ? (
                  <>
                    <button onClick={() => { setShowAdminDashboard(true); setIsMenuOpen(false); }} className="text-zinc-400 text-sm">Ver Panel Central</button>
                    <button onClick={() => { setIsAdmin(false); setIsMenuOpen(false); }} className="text-zinc-400 text-sm">Salir Modo Admin</button>
                  </>
                ) : (
                  <button onClick={() => { setShowAdminModal(true); setIsMenuOpen(false); }} className="text-zinc-400 text-sm">Entrar como Admin</button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );

  return (
    <div className="min-h-screen font-sans bg-zinc-50 text-zinc-900 selection:bg-green-500 selection:text-white overflow-x-hidden">
      <HeaderNav />

      {/* TOAST SYSTEM */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-24 left-1/2 z-[100] px-6 py-3 rounded-full font-bold text-sm shadow-xl flex items-center gap-2 ${
              toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-zinc-900'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODALS */}
      <AnimatePresence>
        {showAdminDashboard && <AdminDashboard showToast={showToast} onClose={() => setShowAdminDashboard(false)} />}
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onLogin={handleLogin} />}
        {showUserDashboard && currentUser && (
          <UserDashboard 
            user={currentUser} 
            reservations={reservations} 
            onClose={() => setShowUserDashboard(false)} 
            onLogout={handleLogout}
            showToast={showToast}
          />
        )}
      </AnimatePresence>

      {/* ADMIN LOGIN MODAL */}
      <AnimatePresence>
        {showAdminModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="bg-white p-8 rounded-2xl w-full max-w-sm shadow-2xl relative">
              <button onClick={() => setShowAdminModal(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700">
                <X size={20} />
              </button>
              <h3 className="text-2xl font-bold mb-6 text-center">Panel Admin</h3>
              <form onSubmit={handleAdminLogin} className="flex flex-col gap-4">
                <input 
                  type="password" 
                  autoFocus
                  placeholder="Contraseña" 
                  className="w-full bg-zinc-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 ring-green-500"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
                <button type="submit" className="w-full bg-zinc-900 text-white font-medium py-3 rounded-lg hover:bg-zinc-800 transition">
                  Ingresar
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO SECTION */}
      <section id="inicio" className="relative min-h-[90vh] flex items-center justify-center pt-20 overflow-hidden">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 bg-zinc-900 z-0">
          <EditableImage 
            isAdmin={isAdmin}
            src={content.hero.image || defaultContent.hero.image}
            onChange={(v) => updateContent('hero', 'image', v)}
            className="absolute inset-0 w-full h-full"
            alt="Tennis Match"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-zinc-50/10"></div>
        </div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto mt-10 md:mt-20">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter uppercase leading-[0.9]">
              <EditableText 
                isAdmin={isAdmin} 
                value={content.hero.title} 
                onChange={(v) => updateContent('hero', 'title', v)} 
              />
            </h1>
            <p className="mt-6 text-lg md:text-2xl text-zinc-300 max-w-2xl mx-auto font-medium">
              <EditableText 
                isAdmin={isAdmin} 
                multiline
                value={content.hero.subtitle} 
                onChange={(v) => updateContent('hero', 'subtitle', v)} 
              />
            </p>
            <div className="mt-10">
              <a href="#reservas" className="inline-block bg-green-500 hover:bg-green-400 text-zinc-900 font-bold text-lg md:text-xl px-10 py-5 rounded-full transition-transform hover:scale-105 shadow-[0_0_40px_rgba(34,197,94,0.4)]">
                <EditableText isAdmin={isAdmin} value={content.hero.button} onChange={(v) => updateContent('hero', 'button', v)} />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SOBRE NOSOTROS */}
      <section id="nosotros" className="py-24 bg-zinc-50 relative">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="order-2 md:order-1">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-8">
              <EditableText isAdmin={isAdmin} value={content.about.title} onChange={(v) => updateContent('about', 'title', v)} />
            </h2>
            <p className="text-lg md:text-xl text-zinc-600 mb-8 leading-relaxed">
              <EditableText isAdmin={isAdmin} multiline value={content.about.text1} onChange={(v) => updateContent('about', 'text1', v)} />
            </p>
            <ul className="space-y-4">
              {content.about.bullets.map((bullet: string, idx: number) => (
                <li key={idx} className="flex items-center gap-4 text-zinc-800 font-medium text-lg bg-white p-4 rounded-xl shadow-sm border border-zinc-100">
                  <div className="bg-green-100 text-green-600 p-2 rounded-full"><CheckCircle size={24} /></div>
                  <EditableText 
                    isAdmin={isAdmin} 
                    value={bullet} 
                    onChange={(v) => {
                      const newBullets = [...content.about.bullets];
                      newBullets[idx] = v;
                      updateContent('about', 'bullets', newBullets);
                    }} 
                  />
                  {isAdmin && (
                    <button 
                      onClick={() => {
                        const newBullets = content.about.bullets.filter((_: any, i: number) => i !== idx);
                        updateContent('about', 'bullets', newBullets);
                      }} 
                      className="ml-auto text-red-400 hover:text-red-500"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </li>
              ))}
              {isAdmin && (
                <button 
                  onClick={() => {
                    updateContent('about', 'bullets', [...content.about.bullets, "Nuevo punto"]);
                  }}
                  className="flex items-center gap-2 text-zinc-500 font-medium hover:text-green-600 transition p-4 border-2 border-dashed border-zinc-300 w-full rounded-xl opacity-50 hover:opacity-100 justify-center"
                >
                  <Plus size={20} /> Agregar punto
                </button>
              )}
            </ul>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="order-1 md:order-2 relative">
             <div className="aspect-[4/5] bg-zinc-200 rounded-[2rem] overflow-hidden relative">
               <EditableImage 
                 isAdmin={isAdmin}
                 src={content.about.image || defaultContent.about.image}
                 onChange={(v) => updateContent('about', 'image', v)}
                 className="w-full h-full"
                 alt="Nosotros"
               />
             </div>
             <div className="absolute -bottom-8 -left-8 bg-white p-6 rounded-3xl shadow-xl flex items-center gap-4 border border-zinc-100">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white"><Award size={32} /></div>
                <div>
                  <div className="text-3xl font-black">10+</div>
                  <div className="text-zinc-500 font-medium text-sm">Años de experiencia</div>
                </div>
             </div>
          </motion.div>
        </div>
      </section>

      {/* SERVICIOS */}
      <section id="servicios" className="py-24 bg-zinc-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black tracking-tight mb-4">Nuestros Servicios</h2>
            <div className="w-24 h-2 bg-green-500 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {content.services.map((service: any, idx: number) => (
              <motion.div 
                key={service.id} 
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} viewport={{ once: true }}
                className="bg-zinc-800 p-8 rounded-3xl group hover:bg-zinc-800/80 transition-colors border border-zinc-700 hover:border-green-500 relative"
              >
                {isAdmin && (
                    <button 
                      onClick={() => {
                        const newServ = content.services.filter((s: any) => s.id !== service.id);
                        setContent((prev: any) => ({ ...prev, services: newServ }));
                      }} 
                      className="absolute top-4 right-4 text-red-400 hover:text-red-500 bg-zinc-900 p-2 rounded-full z-10"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 text-green-500 group-hover:scale-110 transition-transform">
                  <Users size={28} />
                </div>
                <h3 className="text-2xl font-bold mb-4">
                  <EditableText 
                    isAdmin={isAdmin} 
                    value={service.title} 
                    onChange={(v) => {
                      const newServ = [...content.services];
                      newServ[idx].title = v;
                      setContent((prev: any) => ({ ...prev, services: newServ }));
                    }} 
                  />
                </h3>
                <p className="text-zinc-400 leading-relaxed font-medium">
                  <EditableText 
                    isAdmin={isAdmin} 
                    multiline
                    value={service.desc} 
                    onChange={(v) => {
                      const newServ = [...content.services];
                      newServ[idx].desc = v;
                      setContent((prev: any) => ({ ...prev, services: newServ }));
                    }} 
                  />
                </p>
              </motion.div>
            ))}
            
            {isAdmin && (
              <button 
                onClick={() => {
                  setContent((prev: any) => ({ 
                    ...prev, 
                    services: [...prev.services, { id: Date.now(), title: "Nuevo servicio", desc: "Descripción del servicio" }] 
                  }));
                }}
                className="bg-transparent border-2 border-dashed border-zinc-700 hover:border-green-500 text-zinc-500 hover:text-green-500 p-8 rounded-3xl flex flex-col items-center justify-center transition-colors min-h-[300px]"
              >
                <Plus size={48} className="mb-4" />
                <span className="font-bold text-xl">Agregar Servicio</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* GALERÍA */}
      <section id="galeria" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
           <h2 className="text-5xl font-black tracking-tight mb-12 text-center text-zinc-900">
             <EditableText isAdmin={isAdmin} value={content.gallery?.title || defaultContent.gallery.title} onChange={(v) => updateContent('gallery', 'title', v)} />
           </h2>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(content.gallery?.images || defaultContent.gallery.images).map((imgUrl: string, idx: number) => (
                <React.Fragment key={idx}>
                  <EditableImage 
                    isAdmin={isAdmin}
                    src={imgUrl}
                    onChange={(v) => {
                      const newImages = [...(content.gallery?.images || defaultContent.gallery.images)];
                      newImages[idx] = v;
                      updateContent('gallery', 'images', newImages);
                    }}
                    className={`rounded-2xl ${idx === 1 ? 'md:col-span-2' : ''} h-48 md:h-64 overflow-hidden shadow-sm`}
                    alt={`Galeria ${idx}`}
                  />
                </React.Fragment>
              ))}
           </div>
        </div>
      </section>

      {/* RESERVAS Y CONTACTO */}
      <section id="reservas" className="py-24 bg-zinc-100">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16">
           {/* Formulario de Reserva */}
           <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white p-8 md:p-12 rounded-[2rem] shadow-xl border border-zinc-100 relative overflow-hidden">
              <h2 className="text-4xl font-black tracking-tight mb-8 text-zinc-900">Reservar Clase</h2>
              
              <AnimatePresence>
                {resSuccess && (
                  <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-green-100 text-green-800 p-4 rounded-xl mb-6 flex items-center gap-3 font-semibold">
                    <CheckCircle /> Clase reservada correctamente
                  </motion.div>
                )}
              </AnimatePresence>

              {!currentUser ? (
                <div className="bg-zinc-50 p-8 rounded-2xl text-center border border-zinc-200">
                   <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-zinc-400">
                     <User size={32} />
                   </div>
                   <h3 className="text-xl font-bold mb-2">Inicia sesión para reservar</h3>
                   <p className="text-zinc-500 mb-6">Regístrate o entra a tu cuenta para asegurar tu lugar en la cancha.</p>
                   <button onClick={() => setShowAuthModal(true)} className="bg-zinc-900 text-white font-bold px-8 py-3 rounded-full hover:bg-green-600 transition">
                     Iniciar Sesión o Registro
                   </button>
                </div>
              ) : (
                <form onSubmit={handleReservation} className="space-y-8">
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold">{currentUser.name}</div>
                      <div className="text-sm text-zinc-500">{currentUser.email}</div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-zinc-500 mb-2 uppercase tracking-wider">Tu Nivel</label>
                    <select 
                      value={resForm.level} 
                      onChange={e => setResForm({...resForm, level: e.target.value})} 
                      className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 ring-green-500 font-medium"
                    >
                      <option>Principiante</option>
                      <option>Intermedio</option>
                      <option>Avanzado</option>
                    </select>
                  </div>

                  <InteractiveCalendar 
                    selectedDate={resForm.date}
                    selectedTime={resForm.time}
                    onSelectDate={(d) => setResForm({ ...resForm, date: d, time: '' })}
                    onSelectTime={(t) => setResForm({ ...resForm, time: t })}
                    reservations={reservations}
                  />

                  <button 
                    type="submit" 
                    disabled={!resForm.date || !resForm.time}
                    className="w-full bg-zinc-900 text-white font-bold text-lg py-4 rounded-xl hover:bg-green-600 transition-colors mt-6 disabled:opacity-50 disabled:hover:bg-zinc-900"
                  >
                    Confirmar Reserva
                  </button>
                </form>
              )}
           </motion.div>

           {/* Contacto */}
           <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex flex-col justify-center">
              <h2 className="text-4xl font-black tracking-tight mb-8">Contacto</h2>
              
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-zinc-900 shrink-0"><MapPin /></div>
                  <div>
                    <h4 className="font-bold text-lg text-zinc-900">Ubicación</h4>
                    <p className="text-zinc-600 font-medium mt-1">
                      <EditableText isAdmin={isAdmin} value={content.contact.location} onChange={v => updateContent('contact', 'location', v)} />
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-zinc-900 shrink-0"><Clock /></div>
                  <div>
                    <h4 className="font-bold text-lg text-zinc-900">Horario</h4>
                    <p className="text-zinc-600 font-medium mt-1 leading-relaxed">
                      <EditableText isAdmin={isAdmin} multiline value={content.contact.schedule} onChange={v => updateContent('contact', 'schedule', v)} />
                    </p>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-zinc-200">
                   {isAdmin && (
                     <div className="mt-4 flex items-center gap-2">
                       <span className="text-xs font-bold uppercase text-zinc-500">Admin Tel:</span>
                       <EditableText className="text-sm border-b" isAdmin={isAdmin} value={content.contact.phone} onChange={v => updateContent('contact', 'phone', v)} />
                     </div>
                   )}
                </div>
              </div>
           </motion.div>
        </div>
      </section>

      {/* PANEL DE RESERVAS ADMIN */}
      {isAdmin && (
        <section className="py-24 bg-zinc-900 min-h-screen text-white border-t-8 border-green-500">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-4xl font-black">Panel de Control: Reservas</h2>
              <div className="bg-green-500 text-zinc-900 font-bold px-4 py-2 rounded-full text-sm">Modo Admin Activo</div>
            </div>

            {reservations.length === 0 ? (
              <div className="text-center py-20 bg-zinc-800 rounded-3xl border border-zinc-700">
                <p className="text-zinc-400 font-medium text-xl">No hay reservas registradas por el momento.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {reservations.map((res: any, idx) => (
                  <div key={idx} className="bg-zinc-800 p-6 rounded-2xl border border-zinc-700 relative group">
                    <button 
                      onClick={() => setReservationToDelete(res.id)}
                      className="absolute top-4 right-4 text-zinc-500 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={20} />
                    </button>
                    <div className="flex items-center justify-between mb-4 pr-8">
                       <h3 className="font-bold text-xl">{res.name}</h3>
                    </div>
                    <div className="space-y-2 text-sm text-zinc-300">
                       <p className="flex justify-between"><span className="text-zinc-500 uppercase font-bold text-xs tracking-wider">Edad:</span> <span>{res.age} años</span></p>
                       <p className="flex justify-between"><span className="text-zinc-500 uppercase font-bold text-xs tracking-wider">Nivel:</span> <span className="text-green-400 font-semibold">{res.level}</span></p>
                       <p className="flex justify-between"><span className="text-zinc-500 uppercase font-bold text-xs tracking-wider">Día:</span> <span>{res.day}</span></p>
                       <p className="flex justify-between"><span className="text-zinc-500 uppercase font-bold text-xs tracking-wider">Hora:</span> <span>{res.time}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CONFIRM DELETE MODAL */}
            <AnimatePresence>
              {reservationToDelete && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                  <motion.div initial={{ y: 50, scale: 0.95 }} animate={{ y: 0, scale: 1 }} className="bg-zinc-900 p-8 rounded-3xl w-full max-w-sm border border-zinc-700 shadow-2xl relative text-center">
                    <h3 className="text-xl font-bold mb-4 text-white">¿Eliminar Reserva?</h3>
                    <p className="text-zinc-400 mb-8 text-sm">Esta acción no se puede deshacer.</p>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setReservationToDelete(null)}
                        className="flex-1 px-4 py-3 rounded-xl font-bold bg-zinc-800 text-white hover:bg-zinc-700 transition"
                      >Cancelar</button>
                      <button 
                        onClick={async () => {
                          try {
                            await deleteDoc(doc(db, 'reservations', reservationToDelete));
                            showToast('Reserva eliminada', 'success');
                          } catch(err) {
                            console.error(err);
                            showToast('Error al eliminar', 'error');
                          }
                          setReservationToDelete(null);
                        }}
                        className="flex-1 px-4 py-3 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition"
                      >Eliminar</button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="bg-zinc-950 text-zinc-400 py-12 text-center border-t border-zinc-900">
        <p className="font-medium text-sm">© {new Date().getFullYear()} Go Tennis Academy. Todos los derechos reservados.</p>
        <p className="text-xs uppercase tracking-widest mt-2 text-zinc-600">Built with Google AI Studio</p>
      </footer>
    </div>
  );
}
