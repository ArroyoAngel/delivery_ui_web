"use client";
import React, { useState } from 'react';
import { 
  Utensils, ShoppingCart, Pill, Store, Phone, Search, 
  MapPin, Bell, Star, Clock, Home, Zap, Receipt, MessageCircle, 
  User, Bike, Navigation, DollarSign, CheckCircle2, ChevronRight,
  Menu, Filter, Layers
} from 'lucide-react';

const App = () => {
  const [activeView, setActiveView] = useState('client');

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row items-center justify-center gap-8 p-4 md:p-10 font-sans">
      
      {/* Selector de Pantalla para la Demo */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-md p-1 rounded-full shadow-xl border border-white flex gap-1">
        <button 
          onClick={() => setActiveView('client')}
          className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${activeView === 'client' ? 'bg-[#FF6B00] text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          VISTA CLIENTE
        </button>
        <button 
          onClick={() => setActiveView('rider')}
          className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${activeView === 'rider' ? 'bg-[#2563EB] text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          VISTA RIDER
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start mt-12 md:mt-0">
        
        {/* --- PANTALLA 1: CLIENTE --- */}
        <div className={`w-[375px] h-[760px] bg-white rounded-[3rem] shadow-2xl border-[8px] border-gray-900 overflow-hidden relative transition-all duration-500 ${activeView === 'rider' ? 'opacity-30 scale-90 blur-[2px]' : 'scale-100 opacity-100'}`}>
          {/* Status Bar Mock */}
          <div className="h-10 w-full bg-white flex justify-between items-center px-8 pt-4">
            <span className="text-xs font-bold">9:41</span>
            <div className="flex gap-1.5 items-center">
              <div className="w-4 h-2 bg-black/20 rounded-full"></div>
              <div className="w-3 h-3 bg-black/20 rounded-full"></div>
            </div>
          </div>

          {/* Header */}
          <div className="px-5 pt-4 pb-2">
            <div className="flex justify-between items-center mb-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Entregar en</span>
                <div className="flex items-center gap-1">
                  <MapPin size={14} className="text-[#FF6B00]" />
                  <span className="text-sm font-bold text-gray-800">Santa Cruz, Bolivia</span>
                </div>
              </div>
              <div className="relative p-2 bg-gray-50 rounded-full">
                <Bell size={20} className="text-gray-600" />
                <div className="absolute top-2 right-2 w-2 h-2 bg-[#FF6B00] rounded-full border-2 border-white"></div>
              </div>
            </div>

            {/* Logo y Buscador */}
            <div className="mb-4">
               <h1 className="text-2xl font-black text-[#FF6B00] italic tracking-tighter mb-4">YaYa! Eats</h1>
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                 <input 
                  type="text" 
                  placeholder="¿Qué querés comer hoy?" 
                  className="w-full bg-gray-100 border-none rounded-2xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#FF6B00]/20 outline-none"
                 />
               </div>
            </div>
          </div>

          {/* Categorías */}
          <div className="px-5 mb-6">
            <h2 className="font-extrabold text-gray-800 mb-3 text-sm">Categorías</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {[
                { label: 'Restaurantes', icon: Utensils, color: 'bg-orange-50 text-[#FF6B00]' },
                { label: 'Mercados', icon: ShoppingCart, color: 'bg-green-50 text-green-600' },
                { label: 'Farmacias', icon: Pill, color: 'bg-red-50 text-red-600' },
                { label: 'Express', icon: Zap, color: 'bg-yellow-50 text-yellow-600' }
              ].map((cat, i) => (
                <div key={i} className="flex flex-col items-center min-w-[70px] gap-2">
                  <div className={`w-14 h-14 ${cat.color} rounded-2xl flex items-center justify-center shadow-sm`}>
                    <cat.icon size={24} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter">{cat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Restaurantes Populares */}
          <div className="px-5 h-[340px] overflow-y-auto no-scrollbar pb-24">
            <h2 className="font-extrabold text-gray-800 mb-4 text-sm">Populares cerca de ti</h2>
            
            <div className="space-y-6">
              {[
                { name: 'Burger King', time: '20-30 min', rating: '4.5', img: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=200&fit=crop', open: true },
                { name: 'Sushi Go', time: '35-45 min', rating: '4.8', img: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=200&fit=crop', open: true },
                { name: 'Pizzería Napoles', time: '15-25 min', rating: '4.2', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=200&fit=crop', open: false }
              ].map((res, i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="relative h-40 w-full rounded-2xl overflow-hidden mb-2 shadow-sm">
                    <img src={res.img} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt={res.name} />
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur px-2 py-1 rounded-lg text-[9px] font-black text-green-600 border border-green-100">
                      ABIERTO
                    </div>
                    <div className="absolute bottom-3 right-3 bg-white px-3 py-1 rounded-full text-[10px] font-bold shadow-lg flex items-center gap-1">
                      <Clock size={12} className="text-[#FF6B00]" /> {res.time}
                    </div>
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{res.name}</h3>
                      <p className="text-[11px] text-gray-500">Hamburguesas • Americano • $$</p>
                    </div>
                    <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                      <Star size={12} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-xs font-bold">{res.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Nav Cliente */}
          <div className="absolute bottom-0 w-full bg-white border-t border-gray-100 px-6 py-4 pb-6 flex justify-between items-center shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-20">
            <div className="flex flex-col items-center gap-1 text-[#FF6B00]">
              <Home size={22} />
              <span className="text-[9px] font-bold uppercase">Inicio</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-gray-400">
              <Zap size={22} />
              <span className="text-[9px] font-bold uppercase">Express</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-gray-400">
              <Receipt size={22} />
              <span className="text-[9px] font-bold uppercase">Pedidos</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-gray-400">
              <MessageCircle size={22} />
              <span className="text-[9px] font-bold uppercase">Chat</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-gray-400">
              <User size={22} />
              <span className="text-[9px] font-bold uppercase">Perfil</span>
            </div>
          </div>
        </div>

        {/* --- PANTALLA 2: RIDER --- */}
        <div className={`w-[375px] h-[760px] bg-slate-50 rounded-[3rem] shadow-2xl border-[8px] border-gray-900 overflow-hidden relative transition-all duration-500 ${activeView === 'client' ? 'opacity-30 scale-90 blur-[2px]' : 'scale-100 opacity-100'}`}>
          {/* Status Bar Mock Rider */}
          <div className="h-10 w-full bg-[#2563EB] flex justify-between items-center px-8 pt-4">
            <span className="text-xs font-bold text-white">9:41</span>
            <div className="flex gap-1.5 items-center">
              <div className="w-4 h-2 bg-white/30 rounded-full"></div>
              <div className="w-3 h-3 bg-white/30 rounded-full"></div>
            </div>
          </div>

          {/* Header Rider */}
          <div className="bg-[#2563EB] text-white px-6 pt-4 pb-8 rounded-b-[2.5rem] shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
                  <User size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-sm font-black italic tracking-tighter">YaYa! Rider</h1>
                  <p className="text-[10px] text-blue-100">Luis Angel Arroyo</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
                <span className="text-[10px] font-bold uppercase tracking-tight">En línea</span>
                <div className="w-2.5 h-2.5 bg-green-400 rounded-full shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
                <span className="text-[8px] uppercase font-bold text-blue-100 block mb-1 tracking-widest">Entregas Hoy</span>
                <div className="flex items-center gap-2">
                  <Bike size={16} />
                  <span className="text-xl font-black">05</span>
                </div>
              </div>
              <div className="bg-white/10 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
                <span className="text-[8px] uppercase font-bold text-blue-100 block mb-1 tracking-widest">Ganancias (Bs)</span>
                <div className="flex items-center gap-2">
                  <DollarSign size={16} />
                  <span className="text-xl font-black">125.50</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pedidos Disponibles */}
          <div className="px-5 -mt-4 pb-20 overflow-y-auto h-[450px] no-scrollbar">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-gray-800 text-xs uppercase tracking-widest">Disponibles ahora (2)</h2>
              <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                <Filter size={14} className="text-gray-400" />
              </div>
            </div>

            <div className="space-y-4">
              {/* Pedido 1 */}
              <div className="bg-white p-4 rounded-[2rem] shadow-xl border border-blue-50 relative overflow-hidden group active:scale-[0.98] transition-transform">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-12 -mt-12 opacity-50"></div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-[#FF6B00]">
                        <Utensils size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">Burger King - Cine Center</h3>
                        <p className="text-[10px] text-gray-500 font-medium italic">Preparando pedido...</p>
                      </div>
                    </div>
                    <span className="text-base font-black text-[#2563EB]">Bs. 18.00</span>
                  </div>

                  <div className="space-y-3 mb-5 border-l-2 border-dashed border-gray-100 ml-5 pl-4">
                    <div className="relative">
                      <div className="absolute -left-[21px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gray-300"></div>
                      <p className="text-[11px] text-gray-600 font-medium">Recojo: Av. El Trompillo</p>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-[21px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#2563EB]"></div>
                      <p className="text-[11px] text-gray-900 font-bold">Entrega: Condominio La Riviera (2.4km)</p>
                    </div>
                  </div>

                  <button className="w-full bg-[#2563EB] text-white py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all">
                    Aceptar Pedido
                  </button>
                </div>
              </div>

              {/* Pedido 2 (Mini) */}
              <div className="bg-white/80 p-4 rounded-3xl border border-dashed border-gray-200 flex justify-between items-center opacity-80">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                    <ShoppingCart size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-700 text-[11px]">Hipermaxi Norte</h3>
                    <p className="text-[9px] text-gray-400 uppercase font-black">Bs. 22.00 • 3.1 km</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
              </div>
            </div>
          </div>

          {/* Bottom Nav Rider */}
          <div className="absolute bottom-0 w-full bg-white border-t border-gray-100 px-10 py-4 pb-6 flex justify-between items-center shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-20">
            <div className="flex flex-col items-center gap-1 text-[#2563EB]">
              <div className="relative">
                <Layers size={22} />
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[7px] text-white font-black">2</div>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-tighter">Disponibles</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-gray-300">
              <Navigation size={22} />
              <span className="text-[9px] font-bold uppercase tracking-tighter">Mi Entrega</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-gray-300">
              <User size={22} />
              <span className="text-[9px] font-bold uppercase tracking-tighter">Perfil</span>
            </div>
          </div>
        </div>

      </div>

      {/* Estilos adicionales */}
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
};

export default App;