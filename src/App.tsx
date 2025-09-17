import React, { useState, useEffect } from 'react';
import { Coins, RefreshCw, Zap, TrendingUp } from 'lucide-react';
import { CryptocurrencyCard } from './components/CryptocurrencyCard';
import { EnhancedPriceChart } from './components/EnhancedPriceChart';
import { PredictionCard } from './components/PredictionCard';
import { CryptoSelector } from './components/CryptoSelector';
import { CoinOverview } from './components/CoinOverview';
import { CryptoCurrency, ChartData, PredictionData } from './types/crypto';
import { fetchCryptocurrencies, fetchPriceHistory, generatePrediction } from './services/cryptoAPI';

const SUPPORTED_CRYPTOS = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
  { id: 'solana', name: 'Solana', symbol: 'SOL' },
  { id: 'binancecoin', name: 'BNB', symbol: 'BNB' },
  { id: 'cardano', name: 'Cardano', symbol: 'ADA' },
  { id: 'polkadot', name: 'Polkadot', symbol: 'DOT' },
  { id: 'chainlink', name: 'Chainlink', symbol: 'LINK' },
  { id: 'litecoin', name: 'Litecoin', symbol: 'LTC' },
];

function App() {
  const [cryptos, setCryptos] = useState<CryptoCurrency[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState<string>('bitcoin');
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showCoinOverview, setShowCoinOverview] = useState(false);
  const [overviewCoinId, setOverviewCoinId] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const cryptoIds = SUPPORTED_CRYPTOS.map(crypto => crypto.id);
      const [cryptoData, priceHistory] = await Promise.all([
        fetchCryptocurrencies(cryptoIds),
        fetchPriceHistory(selectedCrypto)
      ]);

      setCryptos(cryptoData);
      setChartData(priceHistory);
      
      const selectedCryptoData = cryptoData.find(crypto => crypto.id === selectedCrypto);
      if (selectedCryptoData) {
        setPrediction(generatePrediction(selectedCryptoData));
      }
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCrypto]);

  useEffect(() => {
    const interval = setInterval(loadData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [selectedCrypto]);

  const selectedCryptoData = cryptos.find(crypto => crypto.id === selectedCrypto);

  const handleViewCoinDetails = (coinId: string) => {
    setOverviewCoinId(coinId);
    setShowCoinOverview(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Coin Overview Modal */}
      {showCoinOverview && (
        <CoinOverview
          coinId={overviewCoinId}
          onClose={() => setShowCoinOverview(false)}
        />
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">
              Crypto<span className="text-blue-400">Tracker</span>
            </h1>
          </div>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Professional cryptocurrency tracking with real-time data, advanced analytics, and AI-powered insights
          </p>
        </header>

        {/* Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 space-y-4 md:space-y-0">
          <div className="w-full md:w-96">
            <CryptoSelector
              availableCryptos={SUPPORTED_CRYPTOS}
              selectedCrypto={selectedCrypto}
              onSelect={setSelectedCrypto}
            />
          </div>
          
          <div className="flex items-center space-x-4">
            {lastUpdated && (
              <p className="text-gray-400 text-sm">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 rounded-lg transition-colors duration-200"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-white font-medium">
                {loading ? 'Updating...' : 'Refresh'}
              </span>
            </button>
          </div>
        </div>

        {loading && cryptos.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                <Zap className="w-8 h-8 text-white animate-pulse" />
              </div>
              <p className="text-white text-lg">Loading cryptocurrency data...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Cryptocurrency Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {cryptos.map((crypto) => (
                <CryptocurrencyCard
                  key={crypto.id}
                  crypto={crypto}
                  isSelected={crypto.id === selectedCrypto}
                  onClick={() => setSelectedCrypto(crypto.id)}
                  onViewDetails={() => handleViewCoinDetails(crypto.id)}
                />
              ))}
            </div>

            {/* Selected Crypto Details */}
            {selectedCryptoData && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <EnhancedPriceChart coinId={selectedCrypto} currency={selectedCryptoData.symbol} />
                {prediction && (
                  <PredictionCard
                    prediction={prediction}
                    currentPrice={selectedCryptoData.current_price}
                  />
                )}
              </div>
            )}

            {/* Market Overview Stats */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Market Overview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-gray-400 text-sm">Total Market Cap</p>
                  <p className="text-2xl font-bold text-white">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      notation: 'compact',
                      maximumFractionDigits: 2
                    }).format(cryptos.reduce((sum, crypto) => sum + crypto.market_cap, 0))}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-sm">24h Volume</p>
                  <p className="text-2xl font-bold text-white">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      notation: 'compact',
                      maximumFractionDigits: 2
                    }).format(cryptos.reduce((sum, crypto) => sum + crypto.total_volume, 0))}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-sm">Gainers</p>
                  <p className="text-2xl font-bold text-green-400">
                    {cryptos.filter(crypto => (crypto.price_change_percentage_24h ?? 0) > 0).length}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-sm">Losers</p>
                  <p className="text-2xl font-bold text-red-400">
                    {cryptos.filter(crypto => (crypto.price_change_percentage_24h ?? 0) < 0).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-16 py-8 border-t border-white/10">
          <p className="text-gray-400">
            Professional crypto tracking platform built with React, TypeScript, and Tailwind CSS. 
            Real-time data powered by CoinGecko API with advanced analytics and AI predictions.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;