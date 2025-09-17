import { 
  CryptoCurrency, 
  DetailedCoinData, 
  ExchangeData, 
  TradingPair, 
  PredictionData, 
  ChartData, 
  CandlestickData, 
  OnChainData, 
  NewsItem, 
  ChartTimeframe, 
  ComparisonAsset 
} from '../types/crypto';

// Use a configurable API base URL so the app works in both development and
// production environments. During development the Vite dev server can proxy
// "/api/v3" requests to CoinGecko via `VITE_API_BASE_URL`. In production the
// app falls back to the full CoinGecko endpoint.
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'https://api.coingecko.com/api/v3';

// Retry mechanism with exponential backoff
const fetchWithRetry = async (url: string, options: RequestInit = {}, retries: number = 3): Promise<Response> => {
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Accept': 'application/json',
          ...options.headers
        }
      });
      
      // If successful or client error (4xx), return immediately
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }
      
      // For server errors (5xx) or rate limits (429), retry
      if (attempt < retries && (response.status >= 500 || response.status === 429)) {
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10 seconds
        console.warn(`API request failed (${response.status}), retrying in ${backoffDelay}ms... (attempt ${attempt + 1}/${retries + 1})`);
        await delay(backoffDelay);
        continue;
      }
      
      // Log detailed error information for debugging
      const errorBody = await response.text();
      console.error(`API request failed with status ${response.status}: ${errorBody}`);
      
      return response;
    } catch (error) {
      // Network errors - retry if attempts remaining
      if (attempt < retries) {
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt), 10000);
        console.warn(`Network error, retrying in ${backoffDelay}ms... (attempt ${attempt + 1}/${retries + 1})`, error);
        await delay(backoffDelay);
        continue;
      }
      throw error;
    }
  }
  
  throw new Error('Max retries exceeded');
};

// Cache management
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

const getCachedData = (key: string) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCachedData = (key: string, data: any, ttl: number = 30000) => {
  cache.set(key, { data, timestamp: Date.now(), ttl });
};

export const fetchCryptocurrencies = async (ids: string[]): Promise<CryptoCurrency[]> => {
  const cacheKey = `cryptos-${ids.join(',')}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetchWithRetry(
      `${API_BASE_URL}/coins/markets?vs_currency=usd&ids=${ids.join(',')}&order=market_cap_desc&sparkline=false&price_change_percentage=24h,7d,30d`
    );
    if (!response.ok) throw new Error('Failed to fetch data');
    const data = await response.json();
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching cryptocurrencies:', error);
    return generateMockData(ids);
  }
};

export const fetchDetailedCoinData = async (id: string): Promise<DetailedCoinData> => {
  const cacheKey = `detailed-${id}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetchWithRetry(
      `${API_BASE_URL}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=true&sparkline=false`
    );
    if (!response.ok) throw new Error('Failed to fetch detailed data');
    const data = await response.json();
    setCachedData(cacheKey, data, 60000); // Cache for 1 minute
    return data;
  } catch (error) {
    console.error('Error fetching detailed coin data:', error);
    return generateMockDetailedData(id);
  }
};

export const fetchExchanges = async (): Promise<ExchangeData[]> => {
  const cacheKey = 'exchanges';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/exchanges`);
    if (!response.ok) throw new Error('Failed to fetch exchanges');
    const data = await response.json();
    setCachedData(cacheKey, data, 300000); // Cache for 5 minutes
    return data;
  } catch (error) {
    console.error('Error fetching exchanges:', error);
    return generateMockExchanges();
  }
};

export const fetchTradingPairs = async (coinId: string): Promise<TradingPair[]> => {
  const cacheKey = `pairs-${coinId}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/coins/${coinId}/tickers?include_exchange_logo=true&page=1&depth=true`);
    if (!response.ok) throw new Error('Failed to fetch trading pairs');
    const data = await response.json();
    setCachedData(cacheKey, data.tickers || [], 60000);
    return data.tickers || [];
  } catch (error) {
    console.error('Error fetching trading pairs:', error);
    return generateMockTradingPairs(coinId);
  }
};

export const fetchPriceHistory = async (
  id: string, 
  timeframe: ChartTimeframe = '7d',
  comparison: ComparisonAsset = 'usd'
): Promise<ChartData[]> => {
  const cacheKey = `history-${id}-${timeframe}-${comparison}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const days = getTimeframeDays(timeframe);
    const interval = days <= 1 ? 'hourly' : days <= 90 ? 'daily' : 'daily';
    
    const response = await fetchWithRetry(
      `${API_BASE_URL}/coins/${id}/market_chart?vs_currency=${comparison}&days=${days}&interval=${interval}`
    );
    if (!response.ok) throw new Error('Failed to fetch price history');
    const data = await response.json();
    
    const chartData = data.prices.map(([timestamp, price]: [number, number], index: number) => ({
      timestamp,
      price,
      volume: data.total_volumes?.[index]?.[1] || 0,
      market_cap: data.market_caps?.[index]?.[1] || 0
    }));
    
    setCachedData(cacheKey, chartData, 30000);
    return chartData;
  } catch (error) {
    console.error('Error fetching price history:', error);
    return generateMockChartData(timeframe);
  }
};

export const fetchCandlestickData = async (
  id: string, 
  timeframe: ChartTimeframe = '7d'
): Promise<CandlestickData[]> => {
  const cacheKey = `candlestick-${id}-${timeframe}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const days = getTimeframeDays(timeframe);
    const response = await fetchWithRetry(
      `${API_BASE_URL}/coins/${id}/ohlc?vs_currency=usd&days=${days}`
    );
    if (!response.ok) throw new Error('Failed to fetch candlestick data');
    const data = await response.json();
    
    const candlestickData = data.map(([timestamp, open, high, low, close]: number[]) => ({
      timestamp,
      open,
      high,
      low,
      close,
      volume: Math.random() * 1000000 // Mock volume as OHLC doesn't include it
    }));
    
    setCachedData(cacheKey, candlestickData, 30000);
    return candlestickData;
  } catch (error) {
    console.error('Error fetching candlestick data:', error);
    return generateMockCandlestickData(timeframe);
  }
};

export const fetchOnChainData = async (id: string): Promise<OnChainData> => {
  // Mock implementation as this requires specialized APIs
  return generateMockOnChainData(id);
};

export const fetchCryptoNews = async (coinId?: string): Promise<NewsItem[]> => {
  // Mock implementation - in production, use NewsAPI or CryptoCompare
  return generateMockNews(coinId);
};

// AI-powered predictions (enhanced)
export const generatePrediction = (crypto: CryptoCurrency): PredictionData => {
  const volatilityFactor = Math.random() * 0.2 - 0.1; // -10% to +10%
  const trendFactor = crypto.price_change_percentage_24h > 0 ? 0.05 : -0.05;
  const marketCapFactor = crypto.market_cap_rank <= 10 ? 0.02 : -0.02; // Top 10 coins are more stable
  
  const prediction = crypto.current_price * (1 + volatilityFactor + trendFactor + marketCapFactor);
  
  // Enhanced confidence calculation
  const priceStability = Math.abs(crypto.price_change_percentage_24h) < 5 ? 0.1 : -0.1;
  const marketCapStability = crypto.market_cap > 1000000000 ? 0.1 : -0.05; // $1B+ market cap
  const baseConfidence = 0.7;
  
  const confidence = Math.max(0.5, Math.min(0.95, 
    baseConfidence + priceStability + marketCapStability + Math.random() * 0.2
  ));
  
  let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (prediction > crypto.current_price * 1.03) trend = 'bullish';
  else if (prediction < crypto.current_price * 0.97) trend = 'bearish';

  return {
    currency: crypto.symbol.toUpperCase(),
    prediction,
    confidence,
    trend,
    timeframe: '24h'
  };
};

// Helper functions
const getTimeframeDays = (timeframe: ChartTimeframe): number => {
  switch (timeframe) {
    case '1h': return 1;
    case '24h': return 1;
    case '7d': return 7;
    case '30d': return 30;
    case '90d': return 90;
    case '1y': return 365;
    case 'all': return 'max' as any;
    default: return 7;
  }
};

// Mock data generators
const generateMockData = (ids: string[]): CryptoCurrency[] => {
  const mockData: Record<string, Partial<CryptoCurrency>> = {
    bitcoin: {
      id: 'bitcoin',
      symbol: 'btc',
      name: 'Bitcoin',
      current_price: 43250.00,
      price_change_percentage_24h: 2.45,
      price_change_percentage_7d: 5.23,
      price_change_percentage_30d: 12.45,
      market_cap: 847000000000,
      market_cap_rank: 1,
      fully_diluted_valuation: 908000000000,
      total_volume: 25000000000,
      circulating_supply: 19600000,
      total_supply: 19600000,
      max_supply: 21000000,
      ath: 69045,
      ath_date: '2021-11-10T14:24:11.849Z',
      atl: 67.81,
      atl_date: '2013-07-06T00:00:00.000Z',
      image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png'
    },
    ethereum: {
      id: 'ethereum',
      symbol: 'eth',
      name: 'Ethereum',
      current_price: 2650.00,
      price_change_percentage_24h: -1.23,
      price_change_percentage_7d: 3.45,
      price_change_percentage_30d: 8.76,
      market_cap: 318000000000,
      market_cap_rank: 2,
      fully_diluted_valuation: 318000000000,
      total_volume: 15000000000,
      circulating_supply: 120000000,
      total_supply: 120000000,
      max_supply: null,
      ath: 4878.26,
      ath_date: '2021-11-10T14:24:19.604Z',
      atl: 0.432979,
      atl_date: '2015-10-20T00:00:00.000Z',
      image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png'
    },
    solana: {
      id: 'solana',
      symbol: 'sol',
      name: 'Solana',
      current_price: 102.50,
      price_change_percentage_24h: 5.67,
      price_change_percentage_7d: 12.34,
      price_change_percentage_30d: 25.67,
      market_cap: 46000000000,
      market_cap_rank: 5,
      fully_diluted_valuation: 58000000000,
      total_volume: 2500000000,
      circulating_supply: 448000000,
      total_supply: 565000000,
      max_supply: null,
      ath: 259.96,
      ath_date: '2021-11-06T21:54:35.825Z',
      atl: 0.500801,
      atl_date: '2020-05-11T19:35:23.449Z',
      image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png'
    }
  };

  return ids.map(id => {
    const crypto = mockData[id];
    if (!crypto) {
      return {
        id,
        symbol: id.substring(0, 3).toUpperCase(),
        name: id.charAt(0).toUpperCase() + id.slice(1),
        current_price: 1.00,
        price_change_percentage_24h: 0,
        price_change_percentage_7d: 0,
        price_change_percentage_30d: 0,
        market_cap: 1000000,
        market_cap_rank: 999,
        fully_diluted_valuation: 1000000,
        total_volume: 100000,
        circulating_supply: 1000000,
        total_supply: 1000000,
        max_supply: 1000000,
        ath: 2.00,
        ath_date: new Date().toISOString(),
        atl: 0.50,
        atl_date: new Date().toISOString(),
        image: `https://via.placeholder.com/32x32/6366f1/ffffff?text=${id.charAt(0).toUpperCase()}`,
        last_updated: new Date().toISOString()
      };
    }
    return {
      ...crypto,
      last_updated: new Date().toISOString()
    } as CryptoCurrency;
  });
};

const generateMockDetailedData = (id: string): DetailedCoinData => {
  const baseData = generateMockData([id])[0];
  return {
    ...baseData,
    description: `${baseData.name} is a decentralized digital currency that enables instant payments to anyone, anywhere in the world.`,
    homepage: [`https://${id}.org`],
    blockchain_site: [`https://blockchair.com/${id}`],
    official_forum_url: [`https://bitcointalk.org`],
    chat_url: [`https://t.me/${id}`],
    announcement_url: [`https://bitcointalk.org/index.php?topic=${id}`],
    twitter_screen_name: `${id}`,
    telegram_channel_identifier: `${id}`,
    subreddit_url: `https://reddit.com/r/${id}`,
    repos_url: {
      github: [`https://github.com/${id}/${id}`]
    },
    contract_address: id === 'ethereum' ? undefined : '0x1234567890123456789012345678901234567890',
    genesis_date: '2009-01-03',
    hashing_algorithm: 'SHA-256',
    categories: ['Cryptocurrency', 'Store of Value'],
    market_data: {
      price_change_24h_in_currency: { usd: baseData.current_price * 0.02 },
      price_change_percentage_1h_in_currency: { usd: 0.5 },
      market_cap_change_24h_in_currency: { usd: baseData.market_cap * 0.02 },
      market_cap_change_percentage_24h_in_currency: { usd: 2.1 }
    }
  };
};

const generateMockExchanges = (): ExchangeData[] => {
  return [
    {
      id: 'binance',
      name: 'Binance',
      image: 'https://assets.coingecko.com/markets/images/52/small/binance.jpg',
      trust_score: 10,
      trust_score_rank: 1,
      trade_volume_24h_btc: 150000,
      url: 'https://www.binance.com'
    },
    {
      id: 'coinbase-exchange',
      name: 'Coinbase Exchange',
      image: 'https://assets.coingecko.com/markets/images/23/small/Coinbase_Coin_Primary.png',
      trust_score: 10,
      trust_score_rank: 2,
      trade_volume_24h_btc: 80000,
      url: 'https://pro.coinbase.com'
    },
    {
      id: 'kraken',
      name: 'Kraken',
      image: 'https://assets.coingecko.com/markets/images/29/small/kraken.jpg',
      trust_score: 10,
      trust_score_rank: 3,
      trade_volume_24h_btc: 45000,
      url: 'https://www.kraken.com'
    }
  ];
};

const generateMockTradingPairs = (coinId: string): TradingPair[] => {
  const symbol = coinId === 'bitcoin' ? 'BTC' : coinId === 'ethereum' ? 'ETH' : 'SOL';
  return [
    {
      base: symbol,
      target: 'USDT',
      market: {
        name: 'Binance',
        identifier: 'binance',
        has_trading_incentive: false
      },
      last: 43250,
      volume: 125000000,
      converted_last: { btc: 1, eth: 16.3, usd: 43250 },
      converted_volume: { btc: 2890, eth: 47127, usd: 125000000 },
      trust_score: 'green',
      bid_ask_spread_percentage: 0.01,
      timestamp: new Date().toISOString(),
      last_traded_at: new Date().toISOString(),
      last_fetch_at: new Date().toISOString(),
      is_anomaly: false,
      is_stale: false,
      trade_url: `https://www.binance.com/en/trade/${symbol}_USDT`
    }
  ];
};

const generateMockChartData = (timeframe: ChartTimeframe): ChartData[] => {
  const now = Date.now();
  const data: ChartData[] = [];
  const points = timeframe === '1h' ? 60 : timeframe === '24h' ? 24 : 168;
  const interval = timeframe === '1h' ? 60000 : timeframe === '24h' ? 3600000 : 3600000;
  
  for (let i = 0; i < points; i++) {
    const timestamp = now - (points - i) * interval;
    const price = 43000 + Math.sin(i * 0.1) * 2000 + Math.random() * 1000;
    const volume = Math.random() * 1000000000;
    const market_cap = price * 19600000;
    data.push({ timestamp, price, volume, market_cap });
  }
  
  return data;
};

const generateMockCandlestickData = (timeframe: ChartTimeframe): CandlestickData[] => {
  const now = Date.now();
  const data: CandlestickData[] = [];
  const points = timeframe === '1h' ? 60 : timeframe === '24h' ? 24 : 168;
  const interval = timeframe === '1h' ? 60000 : timeframe === '24h' ? 3600000 : 3600000;
  
  let lastClose = 43000;
  
  for (let i = 0; i < points; i++) {
    const timestamp = now - (points - i) * interval;
    const open = lastClose + (Math.random() - 0.5) * 100;
    const high = open + Math.random() * 500;
    const low = open - Math.random() * 500;
    const close = low + Math.random() * (high - low);
    const volume = Math.random() * 1000000;
    
    data.push({ timestamp, open, high, low, close, volume });
    lastClose = close;
  }
  
  return data;
};

const generateMockOnChainData = (id: string): OnChainData => {
  return {
    active_addresses: Math.floor(Math.random() * 1000000) + 100000,
    transaction_count: Math.floor(Math.random() * 500000) + 50000,
    large_transactions: Math.floor(Math.random() * 1000) + 100,
    average_transaction_value: Math.random() * 10000 + 1000,
    network_hash_rate: id === 'bitcoin' ? Math.random() * 200 + 150 : undefined,
    holders_count: Math.floor(Math.random() * 5000000) + 1000000
  };
};

const generateMockNews = (coinId?: string): NewsItem[] => {
  const titles = [
    'Major Institutional Adoption Drives Price Rally',
    'New Partnership Announced with Fortune 500 Company',
    'Technical Analysis Shows Strong Support Levels',
    'Regulatory Clarity Brings Positive Market Sentiment',
    'Network Upgrade Improves Scalability and Security'
  ];
  
  return titles.map((title, index) => ({
    id: `news-${index}`,
    title: `${coinId ? coinId.toUpperCase() : 'Crypto'}: ${title}`,
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    url: `https://example.com/news/${index}`,
    source: 'CryptoNews',
    published_at: new Date(Date.now() - index * 3600000).toISOString(),
    sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)] as any
  }));
};