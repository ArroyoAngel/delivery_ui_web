'use client';

import React, { useState } from 'react';
import { 
  Utensils, ShoppingCart, Pill, Store, Phone, Layers, 
  RefreshCcw, MapPin, Bike, ClipboardCheck, Navigation, Box,
  Briefcase, Star, Clock, ShieldCheck
} from 'lucide-react';

export default function App() {
  type CardMode = 'client' | 'driver' | 'restaurant' | 'admin';
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardMode, setCardMode] =  useState<CardMode>('client');

  // URLs para los QR
  const playStoreLink = "https://play.google.com/store/apps/details?id=com.yaya.eats"; 
  const waDriverMsg = encodeURIComponent("Hola Ing. Luis, me contacto con usted gracias a su tarjeta. Me interesa ser Rider de YaYa! Eats.");
  const waRestMsg = encodeURIComponent("Hola Ing. Luis, me contacto con usted gracias a su tarjeta. Quiero activar mi restaurante en YaYa! Eats.");

  // Configuración de cada versión
  const cardData = {
    client: {
      title: 'Eats',
      color: 'from-[#FF6B00] to-[#FF3D00]',
      brandColor: 'text-[#FF6B00]',
      tagline: '¡Lo que necesites, al instante!',
      showLoginFields: false,
      qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${playStoreLink}`,
      qrText: 'Descarga la App',
      mainIcon: Utensils,
      icons: [
        { Icon: Utensils, label: 'Restaurantes' },
        { Icon: ShoppingCart, label: 'Mercados' },
        { Icon: Pill, label: 'Farmacias' },
        { Icon: Store, label: 'Tiendas' }
      ]
    },
    driver: {
      title: 'Eats',
      color: 'from-[#2563EB] to-[#1E40AF]', // Azul profesional para Riders
      brandColor: 'text-[#2563EB]',
      tagline: '¡Genera ingresos con tu Moto!',
      showLoginFields: false,
      qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://wa.me/59173666496?text=${waDriverMsg}`,
      qrText: 'Postular como Rider',
      mainIcon: Bike,
      icons: [
        { Icon: Bike, label: 'Motos' },
        { Icon: ClipboardCheck, label: 'Pedidos' },
        { Icon: Box, label: 'Entregas' },
        { Icon: Navigation, label: 'Rutas' }
      ]
    },
    restaurant: {
      title: 'Eats',
      color: 'from-[#2C2C2C] to-[#000000]', // Negro formal
      brandColor: 'text-[#D4AF37]', // Dorado/Oro para el toque formal
      tagline: 'CREDENCIALES DE ACCESO:',
      showLoginFields: true,
      qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://wa.me/59173666496?text=${waRestMsg}`,
      qrText: 'Soporte Partners',
      mainIcon: Briefcase,
      icons: []
    },
    admin: {
      title: 'Workspace',
      color: 'from-[#1a1a2e] to-[#16213e]',
      brandColor: 'text-[#FF6B00]',
      tagline: '¡Gestión y control total!',
      showLoginFields: false,
      qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://yaya.work/`,
      qrText: 'Acceder al Panel',
      mainIcon: ShieldCheck,
      icons: [
        { Icon: Briefcase, label: 'Gestión' },
        { Icon: Store, label: 'Tiendas' },
        { Icon: Bike, label: 'Riders' },
        { Icon: Star, label: 'Reportes' },
      ]
    }
  };

  const current = cardData[cardMode];
  const MainBgIcon = current.mainIcon;

  return (
    <div className="min-h-screen bg-gray-200 flex flex-col items-center justify-center p-4 font-sans">
      
      <div className="mb-6 text-center max-w-lg w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Editor de Tarjetas YaYa!</h1>
        <p className="text-gray-600 mb-4 text-sm font-medium">
          Cambia la versión y gira la tarjeta para ver los detalles de impresión.
        </p>
        
        {/* Selector de Versiones */}
        <div className="flex bg-white rounded-xl p-1 shadow-md border border-gray-300">
          <button 
            onClick={() => {setCardMode('client'); setIsFlipped(false);}}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold rounded-lg transition-all ${cardMode === 'client' ? 'bg-[#FF6B00] text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            CLIENTES
          </button>
          <button 
            onClick={() => {setCardMode('driver'); setIsFlipped(false);}}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold rounded-lg transition-all ${cardMode === 'driver' ? 'bg-[#2563EB] text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            RIDERS
          </button>
          <button
            onClick={() => {setCardMode('restaurant'); setIsFlipped(false);}}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold rounded-lg transition-all ${cardMode === 'restaurant' ? 'bg-black text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            RESTAURANTES
          </button>
          <button
            onClick={() => {setCardMode('admin'); setIsFlipped(false);}}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold rounded-lg transition-all ${cardMode === 'admin' ? 'bg-[#1a1a2e] text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            ADMIN
          </button>
        </div>
      </div>

      {/* Contenedor de la Tarjeta */}
      <div className="relative w-full max-w-[420px] aspect-[1.75/1] cursor-pointer perspective-1000" onClick={() => setIsFlipped(!isFlipped)}>
        
        <div className={`w-full h-full transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* ================= ANVERSO (FRENTE) ================= */}
          <div className={`absolute w-full h-full backface-hidden rounded-2xl shadow-2xl overflow-hidden bg-gradient-to-br ${current.color} text-white flex flex-col transition-all duration-500 border border-white/10`}>
            
            {/* Patrón de fondo */}
            <div className="absolute inset-0 opacity-10 flex flex-wrap justify-around items-center gap-6 p-4 pointer-events-none">
              {[...Array(12)].map((_, i) => (
                <MainBgIcon key={`bg-icon-${i}`} size={32} />
              ))}
            </div>

            <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-4 text-center w-full">
              {/* Logo Central - Altura Fija para evitar saltos */}
              <div className="h-16 flex items-center justify-center mb-2 mt-2">
                <div className="bg-white px-5 py-2.5 rounded-full font-black text-3xl sm:text-4xl tracking-tighter shadow-xl transform -skew-x-6 border-b-4 border-black/10">
                  <span className="text-[#FF6B00]">YaYa!</span> <span className={cardMode === 'restaurant' ? 'text-black' : (cardMode === 'driver' ? 'text-[#2563EB]' : 'text-gray-800')}>{current.title}</span>
                </div>
              </div>
              
              {!current.showLoginFields ? (
                <p className="text-base sm:text-lg font-bold tracking-wide mt-2 drop-shadow-lg px-2 uppercase italic opacity-90">
                  {current.tagline}
                </p>
              ) : (
                <div className="w-full max-w-[280px] flex flex-col items-center pb-4">
                  <div className="w-full bg-black/40 p-3 rounded-xl backdrop-blur-md border border-white/20 text-left">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold w-12 text-white/70">CORREO:</span>
                        <div className="bg-white rounded h-6 flex-1 shadow-inner"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold w-12 text-white/70">CLAVE:</span>
                        <div className="bg-white rounded h-6 flex-1 shadow-inner"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer del Frente (Iconos) */}
            <div className="h-14 relative z-10 bg-black/20 backdrop-blur-md px-6 flex justify-between items-center text-[9px] sm:text-[10px] font-bold border-t border-white/10">
              {current.icons.length > 0 ? (
                current.icons.map((item: { Icon: React.ElementType; label: string }, idx: number) => (
                  <div key={idx} className="flex flex-col items-center gap-1 opacity-90">
                    <item.Icon size={16} />
                    <span className="uppercase tracking-tighter">{item.label}</span>
                  </div>
                ))
              ) : (
                <div className="w-full flex justify-around opacity-70">
                   <div className="flex items-center gap-1"><ShieldCheck size={14}/> <span>OFICIAL</span></div>
                   <div className="flex items-center gap-1"><Clock size={14}/> <span>24/7</span></div>
                   <div className="flex items-center gap-1"><Star size={14}/> <span>PARTNER</span></div>
                </div>
              )}
            </div>
          </div>

          {/* ================= REVERSO (ATRÁS) ================= */}
          <div className="absolute w-full h-full backface-hidden rounded-2xl shadow-2xl overflow-hidden bg-[#121214] text-white rotate-y-180 flex flex-col justify-between p-6 border border-white/5">
            
            <div className="flex flex-1 justify-between gap-6">
              {/* Información de Contacto */}
              <div className="flex flex-col justify-center">
                <div className="mb-4">
                  <div className="text-[10px] text-[#FF6B00] font-black tracking-[0.2em] mb-1">CONTACTO DIRECTO</div>
                  <h2 className="text-lg sm:text-xl font-black leading-none text-white">LUIS ANGEL</h2>
                  <h2 className="text-lg sm:text-xl font-black leading-none text-white">ARROYO ACUÑA</h2>
                  <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-widest border-l-2 border-[#FF6B00] pl-2">Ingeniero de Sistemas</p>
                </div>

                <div className="space-y-3 mt-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/5 p-2 rounded-lg text-[#FF6B00]">
                      <Phone size={16} />
                    </div>
                    <span className="text-gray-200 text-sm font-bold tracking-widest">+591 73666496</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-white/5 p-2 rounded-lg text-gray-400">
                      <MapPin size={16} />
                    </div>
                    <span className="text-gray-400 text-[10px] sm:text-xs font-medium">Santa Cruz, Bolivia</span>
                  </div>
                </div>
              </div>

              {/* Lado del QR */}
              <div className="flex flex-col items-center justify-center">
                <div className="bg-white p-2 rounded-xl shadow-[0_0_20px_rgba(255,107,0,0.2)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={current.qrUrl} alt="QR Code" className="w-16 h-16 sm:w-20 sm:h-20 object-contain" />
                </div>
                <div className={`mt-3 text-[8px] sm:text-[9px] font-black text-center uppercase tracking-tighter px-3 py-1.5 rounded-lg w-full ${cardMode === 'restaurant' ? 'bg-[#D4AF37] text-black' : (cardMode === 'driver' ? 'bg-[#2563EB] text-white' : 'bg-[#FF6B00] text-white')}`}>
                  {current.qrText}
                </div>
              </div>
            </div>

            {/* Logo de Workspace */}
            <div className="mt-4 pt-4 flex items-center justify-between text-[9px] text-gray-500 font-bold border-t border-white/5">
              <div className="flex items-center gap-2">
                <Layers size={14} className="text-[#FF6B00]" />
                <span className="uppercase tracking-widest">YaYa! <span className="text-gray-300">Workspace</span></span>
              </div>
              <div className="text-[8px] opacity-40">© 2024 Todos los derechos reservados</div>
            </div>

          </div>
        </div>
      </div>

      {/* Botón de Girar */}
      <div className="mt-8 flex gap-4">
        <button 
          onClick={() => setIsFlipped(!isFlipped)}
          className="flex items-center gap-2 bg-white text-gray-900 px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1"
        >
          <RefreshCcw size={20} className={isFlipped ? 'rotate-180 transition-transform duration-500 text-[#FF6B00]' : 'transition-transform duration-500 text-[#FF6B00]'} />
          {isFlipped ? 'VER FRENTE' : 'VER REVERSO'}
        </button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}} />
    </div>
  );
}