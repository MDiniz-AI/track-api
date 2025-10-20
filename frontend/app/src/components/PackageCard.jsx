// src/components/PackageCard.jsx

import { useState } from 'react';

// A forma mais limpa é desestruturar as props diretamente aqui
function PackageCard({ package: pkg, onEdit, onDelete }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const toggleFlip = () => setIsFlipped(!isFlipped);

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-500';
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('entregue')) return 'bg-green-500';
    if (lowerStatus.includes('caminho')) return 'bg-blue-500';
    return 'bg-yellow-500';
  };

  const getTrackingUrl = (carrier, code) => {
    if (!carrier || !code) return null;
    if (carrier.toLowerCase().includes('correios')) {
      return `https://rastreamento.correios.com.br/app/index.php?objetos=${code}`;
    }
    return null;
  };

  const trackingUrl = getTrackingUrl(pkg.carrier, pkg.tracking_code);

  return (
    <div className="w-full h-40 [perspective:1000px] mb-4" onClick={toggleFlip}>
      <div 
        className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateX(180deg)]' : ''}`}
      >
        {/* --- FRENTE DO CARD --- */}
        <div className="absolute w-full h-full bg-slate-800 rounded-lg shadow-lg p-6 [backface-visibility:hidden] cursor-pointer">
          <div className="flex justify-between items-start">
            <div className="flex-1 pr-4">
              <h3 className="text-xl font-bold text-white">{pkg.title}</h3>
              <p className="text-sm text-slate-400 mt-1">{pkg.store_name || 'Loja não informada'}</p>
            </div>
            <div className={`text-xs font-semibold text-white px-3 py-1 rounded-full ${getStatusColor(pkg.status)}`}>
              {pkg.status || 'Status desconhecido'}
            </div>
          </div>
        </div>

        {/* --- VERSO DO CARD --- */}
        <div className="absolute w-full h-full bg-slate-800 rounded-lg shadow-lg p-6 [backface-visibility:hidden] [transform:rotateX(180deg)] cursor-pointer">
          <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold text-white mb-4">Detalhes do Pedido</h3>
            <div className="flex gap-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(pkg);
                }}
                className="text-sm text-cyan-400 hover:underline"
              >
                Editar
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Tem certeza que deseja excluir este pacote?')) {
                    onDelete(pkg.id);
                  }
                }}
                className="text-sm text-red-400 hover:underline"
              >
                Excluir
              </button>
            </div>
          </div>
          <div className="space-y-2 text-sm mt-2">
            <p><span className="font-semibold text-slate-400">Cód. Rastreio:</span> <span className="text-white font-mono">{pkg.tracking_code}</span></p>
            <p><span className="font-semibold text-slate-400">Transportadora:</span> <span className="text-white">{pkg.carrier ? pkg.carrier.replace(/\s*Pkg/i, '').trim() : 'Não informada'}</span></p>
            {trackingUrl && (
              <a 
                href={trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-cyan-400 hover:text-cyan-300 hover:underline inline-block mt-2"
              >
                Rastrear no site da transportadora ↗
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PackageCard;