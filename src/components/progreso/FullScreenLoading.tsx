interface FullScreenLoadingProps {
  mensaje?: string | null;
}

export function FullScreenLoading({ mensaje = 'Cargando...' }: FullScreenLoadingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex items-center gap-3">
        <p className="text-sm text-gray-500">{mensaje}</p>
        <div className="spinner" aria-hidden="true">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className={`bar bar${i + 1}`} />
          ))}
        </div>
      </div>
      <style>{`
        .spinner {
          position: relative;
          width: 36px;
          height: 36px;
          display: inline-block;
        }
        .spinner .bar {
          width: 7%;
          height: 20%;
          background: #9ca3af;
          position: absolute;
          left: 49%;
          top: 40%;
          opacity: 0;
          border-radius: 999px;
          animation: fade 1s linear infinite;
        }
        @keyframes fade {
          from { opacity: 1; }
          to { opacity: 0.25; }
        }
        .spinner .bar1  { transform: rotate(0deg)   translate(0, -140%); animation-delay: 0s; }
        .spinner .bar2  { transform: rotate(30deg)  translate(0, -140%); animation-delay: -0.9167s; }
        .spinner .bar3  { transform: rotate(60deg)  translate(0, -140%); animation-delay: -0.8334s; }
        .spinner .bar4  { transform: rotate(90deg)  translate(0, -140%); animation-delay: -0.7501s; }
        .spinner .bar5  { transform: rotate(120deg) translate(0, -140%); animation-delay: -0.6668s; }
        .spinner .bar6  { transform: rotate(150deg) translate(0, -140%); animation-delay: -0.5835s; }
        .spinner .bar7  { transform: rotate(180deg) translate(0, -140%); animation-delay: -0.5002s; }
        .spinner .bar8  { transform: rotate(210deg) translate(0, -140%); animation-delay: -0.4169s; }
        .spinner .bar9  { transform: rotate(240deg) translate(0, -140%); animation-delay: -0.3336s; }
        .spinner .bar10 { transform: rotate(270deg) translate(0, -140%); animation-delay: -0.2503s; }
        .spinner .bar11 { transform: rotate(300deg) translate(0, -140%); animation-delay: -0.1670s; }
        .spinner .bar12 { transform: rotate(330deg) translate(0, -140%); animation-delay: -0.0837s; }
      `}</style>
    </div>
  );
}
