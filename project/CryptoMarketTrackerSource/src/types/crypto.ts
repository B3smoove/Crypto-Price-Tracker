export interface CryptoCurrency {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number | null;
  price_change_percentage_7d?: number | null;
  price_change_percentage_30d?: number | null;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation?: number;
  total_volume: number;
  circulating_supply: number;
  total_supply?: number;
  max_supply?: number;
  ath: number;
  ath_date: string;
  atl: number;
  atl_date: string;
  image: string;
  last_updated: string;
}

export interface DetailedCoinData extends CryptoCurrency {
  description?: string;
  homepage?: string[];
  blockchain_site?: string[];
  official_forum_url?: string[];
  chat_url?: string[];
  announcement_url?: string[];
  twitter_screen_name?: string;
  facebook_username?: string;
  telegram_channel_identifier?: string;
  subreddit_url?: string;
  repos_url?: {
    github?: string[];
    bitbucket?: string[];
  };
  contract_address?: string;
  genesis_date?: string;
  hashing_algorithm?: string;
  categories?: string[];
  public_notice?: string;
  additional_notices?: string[];
  localization?: {
    en?: string;
  };
  market_data?: {
    price_change_24h_in_currency?: { usd: number };
    price_change_percentage_1h_in_currency?: { usd: number };
    market_cap_change_24h_in_currency?: { usd: number };
    market_cap_change_percentage_24h_in_currency?: { usd: number };
    total_value_locked?: number;
  };
}

export interface ExchangeData {
  id: string;
  name: string;
  image: string;
  trust_score: number;
  trust_score_rank: number;
  trade_volume_24h_btc: number;
  url: string;
}

export interface TradingPair {
  base: string;
  target: string;
  market: {
    name: string;
    identifier: string;
    has_trading_incentive: boolean;
  };
  last: number;
  volume: number;
  converted_last: {
    btc: number;
    eth: number;
    usd: number;
  };
  converted_volume: {
    btc: number;
    eth: number;
    usd: number;
  };
  trust_score: string;
  bid_ask_spread_percentage: number;
  timestamp: string;
  last_traded_at: string;
  last_fetch_at: string;
  is_anomaly: boolean;
  is_stale: boolean;
  trade_url: string;
}

export interface PredictionData {
  currency: string;
  prediction: number;
  confidence: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  timeframe: string;
}

export interface ChartData {
  timestamp: number;
  price: number;
  volume?: number;
  market_cap?: number;
}

export interface CandlestickData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OnChainData {
  active_addresses: number;
  transaction_count: number;
  large_transactions: number;
  average_transaction_value: number;
  network_hash_rate?: number;
  holders_count?: number;
}

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  published_at: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export type ChartTimeframe = '1h' | '24h' | '7d' | '30d' | '90d' | '1y' | 'all';
export type ChartType = 'line' | 'candlestick';
export type ComparisonAsset = 'usd' | 'btc' | 'eth';