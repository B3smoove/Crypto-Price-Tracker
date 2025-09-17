import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ExternalLink, 
  Copy, 
  Globe, 
  Twitter, 
  MessageCircle,
  Github,
  Calendar,
  Users,
  Activity,
  DollarSign,
  BarChart3,
  Zap,
  Shield,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { DetailedCoinData, ExchangeData, TradingPair, OnChainData, NewsItem } from '../types/crypto';
import { 
  fetchDetailedCoinData, 
  fetchExchanges, 
  fetchTradingPairs, 
  fetchOnChainData, 
  fetchCryptoNews 
} from '../services/cryptoAPI';

interface CoinOverviewProps {
  coinId: string;
  onClose: () => void;
}

export const CoinOverview: React.FC<CoinOverviewProps> = ({ coinId, onClose }) => {
  const [coinData, setCoinData] = useState<DetailedCoinData | null>(null);
  const [exchanges, setExchanges] = useState<ExchangeData[]>([]);
  const [tradingPairs, setTradingPairs] = useState<TradingPair[]>([]);
  const [onChainData, setOnChainData] = useState<OnChainData | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'markets' | 'analytics' | 'news'>('overview');
  const [copiedAddress, setCopiedAddress] = useState(false);

  useEffect(() => {
    loadCoinData();
  }, [coinId]);

  const loadCoinData = async () => {
    setLoading(true);
    try {
      const [coin, exchangeData, pairs, onChain, newsData] = await Promise.all([
        fetchDetailedCoinData(coinId),
        fetchExchanges(),
        fetchTradingPairs(coinId),
        fetchOnChainData(coinId),
        fetchCryptoNews(coinId)
      ]);

      setCoinData(coin);
      setExchanges(exchangeData);
      setTradingPairs(pairs.slice(0, 10)); // Top 10 pairs
      setOnChainData(onChain);
      setNews(newsData);
    } catch (error) {
      console.error('Error loading coin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const formatNumber = (num: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 2,
      ...options
    }).format(num);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: num > 1000000 ? 'compact' : 'standard',
      maximumFractionDigits: num > 1 ? 2 : 6
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading || !coinData) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-white text-lg">Loading coin data...</span>
          </div>
        </div>
      </div>
    );
  }

  const isPositive24h = (coinData.price_change_percentage_24h ?? 0) > 0;
  const isPositive7d = (coinData.price_change_percentage_7d ?? 0) > 0;
  const isPositive30d = (coinData.price_change_percentage_30d ?? 0) > 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-6xl mx-auto bg-gray-900 rounded-2xl shadow-2xl">
          {/* Header */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">{coinData.name}</h1>
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-400 text-lg uppercase">{coinData.symbol}</span>
                    <span className="bg-gray-700 px-2 py-1 rounded text-sm text-gray-300">
                      Rank #{coinData.market_cap_rank}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
              >
                <span className="text-white text-xl">×</span>
              </button>
            </div>

            {/* Price Section */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-2">
                <p className="text-gray-400 text-sm">Current Price</p>
                <p className="text-4xl font-bold text-white">{formatCurrency(coinData.current_price)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">24h Change</p>
                <div className={`flex items-center space-x-2 ${isPositive24h ? 'text-green-400' : 'text-red-400'}`}>
                  {isPositive24h ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  <span className="text-xl font-semibold">
                    {isPositive24h ? '+' : ''}{(coinData.price_change_percentage_24h ?? 0).toFixed(2)}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-sm">7d Change</p>
                <div className={`flex items-center space-x-2 ${isPositive7d ? 'text-green-400' : 'text-red-400'}`}>
                  {isPositive7d ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  <span className="text-xl font-semibold">
                    {isPositive7d ? '+' : ''}{(coinData.price_change_percentage_7d ?? 0).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-700">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'markets', label: 'Markets', icon: Activity },
                { id: 'analytics', label: 'Analytics', icon: Zap },
                { id: 'news', label: 'News', icon: MessageCircle }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                    activeTab === id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Market Data Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gray-800 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">Market Cap</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(coinData.market_cap)}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      FDV: {formatCurrency(coinData.fully_diluted_valuation ?? coinData.market_cap)}
                    </p>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">24h Volume</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(coinData.total_volume)}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      Vol/MCap: {((coinData.total_volume / coinData.market_cap) * 100).toFixed(2)}%
                    </p>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">All-Time High</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(coinData.ath)}</p>
                    <p className="text-gray-500 text-xs mt-1">{formatDate(coinData.ath_date)}</p>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">All-Time Low</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(coinData.atl)}</p>
                    <p className="text-gray-500 text-xs mt-1">{formatDate(coinData.atl_date)}</p>
                  </div>
                </div>

                {/* Supply Metrics */}
                <div className="bg-gray-800 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Supply Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-gray-400 text-sm">Circulating Supply</p>
                      <p className="text-xl font-bold text-white">
                        {formatNumber(coinData.circulating_supply)} {coinData.symbol.toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Total Supply</p>
                      <p className="text-xl font-bold text-white">
                        {coinData.total_supply ? formatNumber(coinData.total_supply) : 'N/A'} {coinData.symbol.toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Max Supply</p>
                      <p className="text-xl font-bold text-white">
                        {coinData.max_supply ? formatNumber(coinData.max_supply) : '∞'} {coinData.symbol.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  {coinData.max_supply && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-gray-400 mb-2">
                        <span>Supply Progress</span>
                        <span>{((coinData.circulating_supply / coinData.max_supply) * 100).toFixed(2)}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                          style={{ width: `${(coinData.circulating_supply / coinData.max_supply) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Project Links */}
                <div className="bg-gray-800 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <Globe className="w-5 h-5 mr-2" />
                    Official Links
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {coinData.homepage?.[0] && (
                      <a
                        href={coinData.homepage[0]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        <Globe className="w-4 h-4 text-blue-400" />
                        <span className="text-white text-sm">Website</span>
                        <ExternalLink className="w-3 h-3 text-gray-400" />
                      </a>
                    )}
                    {coinData.twitter_screen_name && (
                      <a
                        href={`https://twitter.com/${coinData.twitter_screen_name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        <Twitter className="w-4 h-4 text-blue-400" />
                        <span className="text-white text-sm">Twitter</span>
                        <ExternalLink className="w-3 h-3 text-gray-400" />
                      </a>
                    )}
                    {coinData.telegram_channel_identifier && (
                      <a
                        href={`https://t.me/${coinData.telegram_channel_identifier}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 text-blue-400" />
                        <span className="text-white text-sm">Telegram</span>
                        <ExternalLink className="w-3 h-3 text-gray-400" />
                      </a>
                    )}
                    {coinData.repos_url?.github?.[0] && (
                      <a
                        href={coinData.repos_url.github[0]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        <Github className="w-4 h-4 text-blue-400" />
                        <span className="text-white text-sm">GitHub</span>
                        <ExternalLink className="w-3 h-3 text-gray-400" />
                      </a>
                    )}
                  </div>

                  {coinData.contract_address && (
                    <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm">Contract Address</p>
                          <p className="text-white font-mono text-sm">{coinData.contract_address}</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(coinData.contract_address!)}
                          className="flex items-center space-x-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                        >
                          {copiedAddress ? (
                            <CheckCircle className="w-4 h-4 text-white" />
                          ) : (
                            <Copy className="w-4 h-4 text-white" />
                          )}
                          <span className="text-white text-sm">
                            {copiedAddress ? 'Copied!' : 'Copy'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                {coinData.description && (
                  <div className="bg-gray-800 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">About {coinData.name}</h3>
                    <p className="text-gray-300 leading-relaxed">{coinData.description}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'markets' && (
              <div className="space-y-8">
                {/* Top Exchanges */}
                <div className="bg-gray-800 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Top Exchanges
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {exchanges.slice(0, 6).map((exchange) => (
                      <a
                        key={exchange.id}
                        href={exchange.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                          <Activity className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{exchange.name}</p>
                          <p className="text-gray-400 text-sm">
                            Trust Score: {exchange.trust_score}/10
                          </p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </a>
                    ))}
                  </div>
                </div>

                {/* Trading Pairs */}
                <div className="bg-gray-800 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Top Trading Pairs
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left text-gray-400 text-sm font-medium py-3">Pair</th>
                          <th className="text-left text-gray-400 text-sm font-medium py-3">Exchange</th>
                          <th className="text-right text-gray-400 text-sm font-medium py-3">Price</th>
                          <th className="text-right text-gray-400 text-sm font-medium py-3">Volume</th>
                          <th className="text-center text-gray-400 text-sm font-medium py-3">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tradingPairs.slice(0, 5).map((pair, index) => (
                          <tr key={index} className="border-b border-gray-700/50">
                            <td className="py-3">
                              <span className="text-white font-medium">
                                {pair.base}/{pair.target}
                              </span>
                            </td>
                            <td className="py-3">
                              <span className="text-gray-300">{pair.market.name}</span>
                            </td>
                            <td className="text-right py-3">
                              <span className="text-white">{formatCurrency(pair.last)}</span>
                            </td>
                            <td className="text-right py-3">
                              <span className="text-gray-300">{formatCurrency(pair.converted_volume.usd)}</span>
                            </td>
                            <td className="text-center py-3">
                              <a
                                href={pair.trade_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded text-white text-sm transition-colors"
                              >
                                Trade
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && onChainData && (
              <div className="space-y-8">
                {/* On-Chain Metrics */}
                <div className="bg-gray-800 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <Zap className="w-5 h-5 mr-2" />
                    On-Chain Analytics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gray-700 rounded-lg p-4">
                      <p className="text-gray-400 text-sm">Active Addresses</p>
                      <p className="text-2xl font-bold text-white">{formatNumber(onChainData.active_addresses)}</p>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <p className="text-gray-400 text-sm">Daily Transactions</p>
                      <p className="text-2xl font-bold text-white">{formatNumber(onChainData.transaction_count)}</p>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <p className="text-gray-400 text-sm">Large Transactions</p>
                      <p className="text-2xl font-bold text-white">{formatNumber(onChainData.large_transactions)}</p>
                    </div>
                    {onChainData.holders_count && (
                      <div className="bg-gray-700 rounded-lg p-4">
                        <p className="text-gray-400 text-sm">Holders</p>
                        <p className="text-2xl font-bold text-white">{formatNumber(onChainData.holders_count)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Network Stats */}
                {onChainData.network_hash_rate && (
                  <div className="bg-gray-800 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                      <Activity className="w-5 h-5 mr-2" />
                      Network Statistics
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-700 rounded-lg p-4">
                        <p className="text-gray-400 text-sm">Network Hash Rate</p>
                        <p className="text-2xl font-bold text-white">{onChainData.network_hash_rate.toFixed(2)} EH/s</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-4">
                        <p className="text-gray-400 text-sm">Avg Transaction Value</p>
                        <p className="text-2xl font-bold text-white">{formatCurrency(onChainData.average_transaction_value)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'news' && (
              <div className="space-y-6">
                <div className="bg-gray-800 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Latest News & Updates
                  </h3>
                  <div className="space-y-4">
                    {news.map((article) => (
                      <div key={article.id} className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-white font-medium mb-2">{article.title}</h4>
                            <p className="text-gray-300 text-sm mb-3">{article.description}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-400">
                              <span>{article.source}</span>
                              <span>{formatDate(article.published_at)}</span>
                              {article.sentiment && (
                                <span className={`px-2 py-1 rounded ${
                                  article.sentiment === 'positive' ? 'bg-green-500/20 text-green-400' :
                                  article.sentiment === 'negative' ? 'bg-red-500/20 text-red-400' :
                                  'bg-gray-500/20 text-gray-400'
                                }`}>
                                  {article.sentiment}
                                </span>
                              )}
                            </div>
                          </div>
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-4 p-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-4 h-4 text-white" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};