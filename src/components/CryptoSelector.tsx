import React, { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';

interface CryptoSelectorProps {
  availableCryptos: Array<{ id: string; name: string; symbol: string }>;
  selectedCrypto: string;
  onSelect: (cryptoId: string) => void;
}

export const CryptoSelector: React.FC<CryptoSelectorProps> = ({
  availableCryptos,
  selectedCrypto,
  onSelect
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCryptos = availableCryptos.filter(crypto =>
    crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCryptoData = availableCryptos.find(crypto => crypto.id === selectedCrypto);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-white/20 transition-all duration-200"
      >
        <div className="flex items-center space-x-2">
          <span className="text-white font-semibold">
            {selectedCryptoData?.name || 'Select Cryptocurrency'}
          </span>
          <span className="text-gray-400 text-sm uppercase">
            {selectedCryptoData?.symbol}
          </span>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800/95 backdrop-blur-sm border border-white/10 rounded-xl shadow-xl z-50">
          <div className="p-3 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search cryptocurrencies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {filteredCryptos.map((crypto) => (
              <button
                key={crypto.id}
                onClick={() => {
                  onSelect(crypto.id);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors duration-200 ${
                  selectedCrypto === crypto.id ? 'bg-blue-500/20' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-white font-medium">{crypto.name}</span>
                    <span className="text-gray-400 text-sm ml-2 uppercase">{crypto.symbol}</span>
                  </div>
                  {selectedCrypto === crypto.id && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};