import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Eye } from 'lucide-react';
import { CryptoCurrency } from '../types/crypto';

interface CryptocurrencyCardProps {
  crypto: CryptoCurrency;
  isSelected: boolean;
  onClick: () => void;
  onViewDetails?: () => void;
}

export const CryptocurrencyCard: React.FC<CryptocurrencyCardProps> = ({ 
  crypto, 
  isSelected, 
  onClick,
  onViewDetails
}) => {
  const isPositive = (crypto.price_change_percentage_24h ?? 0) > 0;
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: crypto.current_price > 1 ? 2 : 6
  }).format(crypto.current_price);

  const formattedMarketCap = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 2
  }).format(crypto.market_cap ?? 0);

  const formattedVolume = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 2
  }).format(crypto.total_volume ?? 0);

  return (
    <div 
      className={`
        relative overflow-hidden rounded-2xl p-6 cursor-pointer transition-all duration-300
        backdrop-blur-sm border border-white/10 hover:border-white/20
        ${isSelected 
          ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 shadow-xl scale-105' 
          : 'bg-white/5 hover:bg-white/10 hover:scale-102'
        }
      `}
      onClick={onClick}
    >
      {/* View Details Button */}
      {onViewDetails && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails();
          }}
          className="absolute top-4 right-4 w-8 h-8 bg-gray-700/80 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors z-10"
        >
          <Eye className="w-4 h-4 text-white" />
        </button>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-lg">{crypto.name}</h3>
            <div className="flex items-center space-x-2">
              <p className="text-gray-400 text-sm uppercase">{crypto.symbol}</p>
              <span className="bg-gray-600 px-1.5 py-0.5 rounded text-xs text-gray-300">
                #{crypto.market_cap_rank}
              </span>
            </div>
          </div>
        </div>
        
        <div className={`
          flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium
          ${isPositive 
            ? 'bg-green-500/20 text-green-400' 
            : 'bg-red-500/20 text-red-400'
          }
        `}>
          {isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span>
            {isPositive ? '+' : ''}{(crypto.price_change_percentage_24h ?? 0).toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-gray-400 text-sm">Current Price</p>
          <p className="text-2xl font-bold text-white">{formattedPrice}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-400 text-xs">Market Cap</p>
            <p className="text-white font-semibold">{formattedMarketCap}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Volume (24h)</p>
            <p className="text-white font-semibold">{formattedVolume}</p>
          </div>
        </div>
        
        {/* ATH/ATL indicators */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10">
          <div>
            <p className="text-gray-400 text-xs">ATH</p>
            <p className="text-green-400 font-semibold text-sm">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                notation: 'compact'
              }).format(crypto.ath)}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">ATL</p>
            <p className="text-red-400 font-semibold text-sm">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                notation: 'compact'
              }).format(crypto.atl)}
            </p>
          </div>
        </div>
      </div>

      {isSelected && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 pointer-events-none" />
      )}
    </div>
  );
};