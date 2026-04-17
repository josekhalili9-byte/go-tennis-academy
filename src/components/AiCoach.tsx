import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { MessageCircle, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AiCoach({ contextData }: { contextData: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([{
    role: 'model', 
    text: '¡Hola! Soy tu coach virtual de Go Tennis Academy. ¿En qué te puedo ayudar hoy?'
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if(!input.trim()) return;
    
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const currentHistory = messages.map(m => `[${m.role}]: ${m.text}`).join('\n');
      
      const prompt = `
        Eres el asistente virtual (Coach IA) de "Go Tennis Academy", una academia de tenis en Cuemanco, Xochimilco, CDMX.
        Responde SIEMPRE de forma amable, clara y en español. Si alguien pregunta, motiva a los usuarios a reservar una clase.
        Aquí tienes la información oficial de la academia para que respondas:
        ${JSON.stringify(contextData)}
        
        Historial previo:
        ${currentHistory}
        
        [user]: ${userMsg}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
           // Provide highest reasoning quality
           thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
        }
      });

      setMessages(prev => [...prev, { role: 'model', text: response.text || 'Entendido.' }]);
    } catch(err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', text: 'Lo siento, estoy en la cancha ahora mismo y tengo problemas de conexión. ¡Por favor intenta más tarde!' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-16 right-0 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col"
            style={{ height: '450px' }}
          >
            <div className="bg-green-600 p-4 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse"></span>
                  Entrenador Virtual IA
                </h3>
                <p className="text-xs text-green-100">Go Tennis Academy</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-green-50 hover:bg-green-700 p-1 rounded transition">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                    msg.role === 'user' 
                      ? 'bg-zinc-900 text-white rounded-tr-sm' 
                      : 'bg-white border border-zinc-200 text-zinc-800 rounded-tl-sm shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-zinc-200 rounded-2xl px-4 py-3 rounded-tl-sm flex items-center space-x-1 shadow-sm">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 bg-white border-t border-zinc-100 flex items-center gap-2">
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Escribe un mensaje..."
                className="flex-1 bg-zinc-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 ring-green-500/50"
              />
              <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-green-600 text-white p-2 rounded-full disabled:opacity-50 hover:bg-green-700 transition"
              >
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-green-600 text-white rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition hover:bg-green-700"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </motion.button>
    </div>
  );
}
