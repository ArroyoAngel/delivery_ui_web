import Link from 'next/link';
import { ShieldCheck, FileText, AlertTriangle, CreditCard, Users, Lock, Mail } from 'lucide-react';

const LAST_UPDATED = '25 de marzo de 2026';
const CONTACT_EMAIL = 'yaya.workspace.studio@gmail.com';
const CONTACT_PHONE = '+591 73 666 496';

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-orange-50 p-2 rounded-xl border border-orange-100">
          <Icon size={18} className="text-[#FF6B00]" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      </div>
      <div className="space-y-3 text-sm text-gray-600 leading-relaxed pl-1">
        {children}
      </div>
    </section>
  );
}

function Clause({ num, children }: { num: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="text-[#FF6B00] font-bold shrink-0 w-6">{num}.</span>
      <p>{children}</p>
    </div>
  );
}

export default function PolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="inline-flex items-center font-black text-xl tracking-tighter transform -skew-x-3">
            <span className="text-[#FF6B00]">YaYa!</span>
            <span className="text-gray-800 ml-1">Eats</span>
          </div>
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-gray-500 hover:text-[#FF6B00] transition-colors"
          >
            ← Volver al panel
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Hero */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-100 text-[#FF6B00] text-xs font-bold px-4 py-1.5 rounded-full mb-4">
            <ShieldCheck size={13} />
            DOCUMENTO LEGAL
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">
            Políticas de Uso del Portal
          </h1>
          <p className="text-gray-500 text-sm">
            Para restaurantes y negocios partners de <strong className="text-gray-700">YaYa! Eats</strong>
          </p>
          <p className="text-xs text-gray-400 mt-2">Última actualización: {LAST_UPDATED}</p>
        </div>

        {/* Intro */}
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 mb-10 text-sm text-gray-700 leading-relaxed">
          Bienvenido al Portal de Partners de <strong>YaYa! Eats</strong>. Al registrar tu negocio y utilizar nuestra plataforma, aceptás íntegramente las siguientes políticas. Te recomendamos leerlas con atención. Si tenés dudas, podés contactarnos antes de proceder.
        </div>

        <Section icon={FileText} title="1. Descripción del servicio">
          <Clause num="1.1">
            YaYa! Eats es una plataforma digital de intermediación que conecta negocios locales (restaurantes, mercados, tiendas y farmacias) con clientes finales mediante un servicio de delivery gestionado por riders independientes.
          </Clause>
          <Clause num="1.2">
            El portal web está destinado exclusivamente a los administradores de negocios para gestionar su menú, visualizar pedidos, consultar reportes y configurar su operación dentro de la plataforma.
          </Clause>
          <Clause num="1.3">
            YaYa! Eats actúa como intermediario tecnológico. La responsabilidad sobre la calidad, presentación y exactitud de los productos ofrecidos recae enteramente en el negocio registrado.
          </Clause>
        </Section>

        <Section icon={Users} title="2. Registro y cuenta del negocio">
          <Clause num="2.1">
            El registro en la plataforma es por invitación del equipo de YaYa! Eats. Las credenciales de acceso son personales e intransferibles.
          </Clause>
          <Clause num="2.2">
            El titular de la cuenta es responsable de mantener la confidencialidad de su contraseña. Ante cualquier uso no autorizado, debe notificarnos de inmediato.
          </Clause>
          <Clause num="2.3">
            La información del negocio (nombre, dirección, horarios, menú) debe ser verídica y mantenerse actualizada. Información falsa o engañosa puede resultar en la suspensión de la cuenta.
          </Clause>
          <Clause num="2.4">
            Cada cuenta corresponde a un único negocio. Si operás varias sucursales, cada una requerirá un registro independiente.
          </Clause>
        </Section>

        <Section icon={CreditCard} title="3. Membresía, tarifas y pagos">
          <Clause num="3.1">
            La activación completa del negocio en la plataforma (visibilidad pública, recepción de pedidos regulares) requiere una membresía vigente, cuyas condiciones se comunicarán de forma personalizada.
          </Clause>
          <Clause num="3.2">
            Los negocios sin membresía activa pueden acceder al portal en modo consulta para revisar su información histórica, siempre que el administrador de la plataforma habilite esta opción.
          </Clause>
          <Clause num="3.3">
            YaYa! Eats puede aplicar una comisión por pedido procesado, además de una tarifa de delivery cobrada al cliente. Estas tarifas serán informadas y acordadas previo a la activación del negocio.
          </Clause>
          <Clause num="3.4">
            Los pagos de los clientes se procesan a través de la plataforma. Los montos correspondientes al negocio serán liquidados según el calendario acordado.
          </Clause>
        </Section>

        <Section icon={FileText} title="4. Gestión del menú y productos">
          <Clause num="4.1">
            El negocio es responsable de mantener actualizado su catálogo de productos, incluyendo precios, disponibilidad, stock y descripción.
          </Clause>
          <Clause num="4.2">
            YaYa! Eats no se responsabiliza por pedidos generados a partir de información de menú desactualizada (precios incorrectos, productos sin stock, etc.).
          </Clause>
          <Clause num="4.3">
            Los precios publicados en la plataforma deben ser los precios finales al cliente. No se permite cobrar importes adicionales fuera de la plataforma por pedidos generados a través de YaYa! Eats.
          </Clause>
          <Clause num="4.4">
            El tamaño asignado a cada producto (en el sistema de capacidad de bolsa) debe reflejar fielmente el volumen físico real del producto para garantizar una operación logística eficiente.
          </Clause>
        </Section>

        <Section icon={AlertTriangle} title="5. Obligaciones operativas">
          <Clause num="5.1">
            El negocio debe preparar y tener listo el pedido dentro del tiempo estimado indicado en la plataforma, para cuando el rider llegue a recogerlo.
          </Clause>
          <Clause num="5.2">
            En caso de no poder cumplir con un pedido aceptado (por falta de stock, cierre imprevisto u otro motivo), el negocio debe notificar a YaYa! Eats a la brevedad para gestionar la cancelación y la comunicación al cliente.
          </Clause>
          <Clause num="5.3">
            El incumplimiento reiterado de pedidos aceptados puede resultar en penalidades, suspensión temporal o baja definitiva de la plataforma.
          </Clause>
          <Clause num="5.4">
            Los negocios deben tratar con respeto a los riders de YaYa! Eats. Comportamientos inapropiados serán causal de suspensión.
          </Clause>
        </Section>

        <Section icon={Lock} title="6. Privacidad y uso de datos">
          <Clause num="6.1">
            Los datos del negocio (nombre, dirección, RUC/NIT, contacto) son utilizados exclusivamente para la operación de la plataforma y no serán compartidos con terceros sin consentimiento, salvo obligación legal.
          </Clause>
          <Clause num="6.2">
            Los datos de los clientes (nombre, dirección, historial de pedidos) son propiedad de YaYa! Eats. El negocio no puede utilizarlos para fines de marketing directo ajenos a la plataforma.
          </Clause>
          <Clause num="6.3">
            YaYa! Eats puede recopilar métricas de desempeño del negocio (tiempos de preparación, calificaciones, cancelaciones) para mejorar el servicio y comunicarlas al propio negocio.
          </Clause>
        </Section>

        <Section icon={ShieldCheck} title="7. Propiedad intelectual">
          <Clause num="7.1">
            El negocio otorga a YaYa! Eats una licencia no exclusiva para mostrar su nombre comercial, logotipo e imágenes de productos dentro de la plataforma con fines operativos y promocionales.
          </Clause>
          <Clause num="7.2">
            Queda prohibido el uso del nombre, logotipo o marca de YaYa! Eats en comunicaciones propias del negocio sin autorización previa y por escrito.
          </Clause>
        </Section>

        <Section icon={AlertTriangle} title="8. Modificaciones y terminación">
          <Clause num="8.1">
            YaYa! Eats se reserva el derecho de modificar estas políticas en cualquier momento. Los cambios serán notificados con al menos 7 días de anticipación a través del portal o por correo electrónico.
          </Clause>
          <Clause num="8.2">
            El negocio puede solicitar la baja de la plataforma en cualquier momento contactando al equipo de soporte. Los pedidos activos al momento de la solicitud deben ser completados antes de procesar la baja.
          </Clause>
          <Clause num="8.3">
            YaYa! Eats puede suspender o dar de baja una cuenta sin previo aviso en casos de fraude, incumplimiento grave de estas políticas, o actividad que perjudique a clientes o riders.
          </Clause>
        </Section>

        {/* Contact */}
        <div className="bg-gray-900 rounded-2xl p-6 text-white mt-4">
          <div className="flex items-center gap-2 mb-3">
            <Mail size={16} className="text-[#FF6B00]" />
            <span className="font-bold text-sm">¿Tenés preguntas?</span>
          </div>
          <p className="text-gray-400 text-xs mb-4">
            Nuestro equipo está disponible para aclarar cualquier duda sobre estas políticas antes de que actives tu negocio en la plataforma.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 text-xs">
            <a href={`mailto:${CONTACT_EMAIL}`} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors rounded-xl px-4 py-2.5 font-medium">
              <Mail size={13} className="text-[#FF6B00]" />
              {CONTACT_EMAIL}
            </a>
            <a href="https://wa.me/59173666496" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-[#FF6B00] hover:bg-[#e55f00] transition-colors rounded-xl px-4 py-2.5 font-bold">
              WhatsApp: {CONTACT_PHONE}
            </a>
          </div>
        </div>

        {/* Attributions */}
        <div className="mt-10 border-t border-gray-100 pt-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Créditos y atribuciones</p>
          <ul className="space-y-1.5 text-xs text-gray-400">
            <li>
              Ícono de la aplicación &quot;Order food&quot; diseñado por{' '}
              <a href="https://www.flaticon.com/authors/rian-maulana" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">Rian Maulana</a>
              {' '}de{' '}
              <a href="https://www.flaticon.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">Flaticon</a>
              {' '}— utilizado bajo licencia gratuita con atribución.
            </li>
            <li>
              Íconos de interfaz:{' '}
              <a href="https://fontawesome.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">Font Awesome Free</a>
              {' '}(CC BY 4.0) y{' '}
              <a href="https://lucide.dev" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">Lucide</a>
              {' '}(MIT).
            </li>
          </ul>
        </div>

        <p className="text-center text-xs text-gray-300 mt-6">
          © {new Date().getFullYear()} YaYa! Eats — Política de uso para negocios partners · v1.0
        </p>
      </div>
    </div>
  );
}
