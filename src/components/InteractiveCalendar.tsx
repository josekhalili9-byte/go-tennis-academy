import React from 'react';
import { format, addDays, startOfToday, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface InteractiveCalendarProps {
  selectedDate: Date | null;
  selectedTime: string;
  onSelectDate: (date: Date) => void;
  onSelectTime: (time: string) => void;
  reservations: any[];
}

const TIME_SLOTS = [
  "07:00", "08:00", "09:00", "10:00", "11:00", 
  "16:00", "17:00", "18:00", "19:00", "20:00"
];

// Asumimos 2 instructores. Un horario se llena si tiene 2 reservas.
const MAX_SLOTS_PER_HOUR = 2;

export function InteractiveCalendar({
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
  reservations
}: InteractiveCalendarProps) {
  const today = startOfToday();
  const nextDays = Array.from({ length: 14 }).map((_, i) => addDays(today, i));

  const isSlotFull = (date: Date, time: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const bookings = reservations.filter(r => r.date === dateStr && r.time === time && r.status !== 'Cancelada');
    return bookings.length >= MAX_SLOTS_PER_HOUR;
  };

  const getAvailableCount = (date: Date, time: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const bookings = reservations.filter(r => r.date === dateStr && r.time === time  && r.status !== 'Cancelada');
    return MAX_SLOTS_PER_HOUR - bookings.length;
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <label className="block text-sm font-bold text-zinc-500 mb-3 uppercase tracking-wider">
          1. Selecciona una Fecha
        </label>
        <div className="flex gap-3 overflow-x-auto pb-4 snap-x hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
          {nextDays.map((day, idx) => {
             const isSelected = selectedDate && isSameDay(day, selectedDate);
             return (
               <button
                 key={idx}
                 type="button"
                 onClick={() => onSelectDate(day)}
                 className={`flex-shrink-0 snap-start w-20 flex flex-col items-center p-3 rounded-2xl border-2 transition-all ${
                   isSelected 
                     ? 'border-green-500 bg-green-500 text-white' 
                     : 'border-zinc-200 bg-white text-zinc-700 hover:border-green-300'
                 }`}
               >
                 <span className="text-xs font-bold uppercase">{format(day, 'MMM', { locale: es })}</span>
                 <span className="text-2xl font-black">{format(day, 'd')}</span>
                 <span className="text-xs">{format(day, 'EEE', { locale: es })}</span>
               </button>
             );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <label className="block text-sm font-bold text-zinc-500 mb-3 uppercase tracking-wider">
            2. Selecciona un Horario
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {TIME_SLOTS.map((time) => {
              const full = isSlotFull(selectedDate, time);
              const available = getAvailableCount(selectedDate, time);
              const isSelected = selectedTime === time;

              return (
                <button
                  key={time}
                  type="button"
                  disabled={full}
                  onClick={() => onSelectTime(time)}
                  className={`flex flex-col items-center py-3 rounded-xl border-2 transition-all relative overflow-hidden ${
                    full 
                      ? 'bg-zinc-100 border-zinc-100 text-zinc-400 cursor-not-allowed'
                      : isSelected
                        ? 'border-green-500 bg-green-50 text-green-700 font-bold shadow-sm'
                        : 'border-zinc-200 bg-white hover:border-green-300 text-zinc-700'
                  }`}
                >
                  <span className="text-lg">{time}</span>
                  {full ? (
                    <span className="text-[10px] uppercase font-bold text-red-500 mt-1">Agotado</span>
                  ) : (
                    <span className={`text-[10px] uppercase font-bold mt-1 ${isSelected ? 'text-green-600' : 'text-zinc-400'}`}>
                      {available} {available === 1 ? 'lugar' : 'lugares'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
