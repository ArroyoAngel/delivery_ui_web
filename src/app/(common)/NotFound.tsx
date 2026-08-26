'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, ArrowLeft, Utensils } from 'lucide-react';

export default function NotFoundPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 font-sans">

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-100 rounded-full opacity-40 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-50 rounded-full opacity-60 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-md">

        {/* Logo */}
        <div className="mb-8">
          <div className="inline-flex items-center bg-white px-5 py-2.5 rounded-full font-black text-2xl tracking-tighter shadow-lg border border-gray-100 transform -skew-x-3">
            <span className="text-[#FF6B00]">YaYa!</span>
            <span className="text-gray-800 ml-1">Eats</span>
          </div>
        </div>

        {/* 404 Number */}
        <div className="relative mb-4">
          <span className="text-[120px] font-black leading-none text-gray-100 select-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-[#FF6B00] p-4 rounded-2xl shadow-xl shadow-orange-200 rotate-6">
              <Utensils size={36} className="text-white -rotate-6" />
            </div>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-2xl font-black text-gray-900 mb-3">
          ¡Esta página no está en el menú!
        </h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          La página que buscás no existe, fue movida, o no tenés permiso para verla.
          <br />
          Volvé al panel principal para continuar.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={() => router.back()}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:border-gray-300 hover:bg-gray-50 transition-all"
          >
            <ArrowLeft size={16} />
            Volver atrás
          </button>
          <Link
            href="/dashboard"
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#FF6B00] text-white font-semibold text-sm hover:bg-[#e55f00] shadow-lg shadow-orange-200 transition-all"
          >
            <Home size={16} />
            Ir al panel
          </Link>
        </div>

        {/* Footer */}
        <p className="mt-10 text-xs text-gray-300 font-medium">
          © {new Date().getFullYear()} YaYa! Eats — Todos los derechos reservados
        </p>
      </div>
    </div>
  );
}
