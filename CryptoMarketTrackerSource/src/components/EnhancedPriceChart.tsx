import React, { useEffect, useRef, useState } from 'react';
import { ChartData, CandlestickData, ChartTimeframe, ChartType, ComparisonAsset } from '../types/crypto';
import { fetchPriceHistory, fetchCandlestickData } from '../services/cryptoAPI';
import { TrendingUp, BarChart3, Activity } from 'lucide-react';

interface EnhancedPriceChartProps {
  coinId: string;
  currency: string;
}

export const EnhancedPriceChart: React.FC<EnhancedPriceChartProps> = ({ coinId, currency }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [candlestickData, setCandlestickData] = useState<CandlestickData[]>([]);
  const [timeframe, setTimeframe] = useState<ChartTimeframe>('7d');
  const [chartType, setChartType] = useState<ChartType>('line');
  const [comparison, setComparison] = useState<ComparisonAsset>('usd');
  const [loading, setLoading] = useState(false);

  const timeframes: { value: ChartTimeframe; label: string }[] = [
    { value: '1h', label: '1H' },
    { value: '24h', label: '24H' },
    { value: '7d', label: '7D' },
    { value: '30d', label: '30D' },
    { value: '90d', label: '90D' },
    { value: '1y', label: '1Y' },
    { value: 'all', label: 'ALL' }
  ];

  const comparisons: { value: ComparisonAsset; label: string }[] = [
    { value: 'usd', label: 'USD' },
    { value: 'btc', label: 'BTC' },
    { value: 'eth', label: 'ETH' }
  ];

  useEffect(() => {
    loadChartData();
  }, [coinId, timeframe, comparison, chartType]);

  const loadChartData = async () => {
    setLoading(true);
    try {
      if (chartType === 'line') {
        const data = await fetchPriceHistory(coinId, timeframe, comparison);
        setChartData(data);
      } else {
        const data = await fetchCandlestickData(coinId, timeframe);
        setCandlestickData(data);
      }
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chartType === 'line' && chartData.length > 0) {
      drawLineChart();
    } else if (chartType === 'candlestick' && candlestickData.length > 0) {
      drawCandlestickChart();
    }
  }, [chartData, candlestickData, chartType]);

  const drawLineChart = () => {
    const canvas = canvasRef.current;
    if (!canvas || !chartData.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = rect.width;
    const height = rect.height;
    const padding = 60;

    ctx.clearRect(0, 0, width, height);

    const prices = chartData.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i / 5) * (height - 2 * padding);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Vertical grid lines
    for (let i = 0; i <= 6; i++) {
      const x = padding + (i / 6) * (width - 2 * padding);
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }

    // Draw price line
    ctx.beginPath();
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 3;

    chartData.forEach((point, index) => {
      const x = padding + (index / (chartData.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((point.price - minPrice) / priceRange) * (height - 2 * padding);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw area under curve
    ctx.beginPath();
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');
    ctx.fillStyle = gradient;

    chartData.forEach((point, index) => {
      const x = padding + (index / (chartData.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((point.price - minPrice) / priceRange) * (height - 2 * padding);
      
      if (index === 0) {
        ctx.moveTo(x, height - padding);
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.lineTo(width - padding, height - padding);
    ctx.closePath();
    ctx.fill();

    // Draw price labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'right';
    
    const formatPrice = (price: number) => {
      if (comparison === 'usd') return `$${price.toFixed(2)}`;
      if (comparison === 'btc') return `₿${price.toFixed(8)}`;
      return `Ξ${price.toFixed(6)}`;
    };
    
    ctx.fillText(formatPrice(maxPrice), width - 10, 20);
    ctx.fillText(formatPrice(minPrice), width - 10, height - 10);
  };

  const drawCandlestickChart = () => {
    const canvas = canvasRef.current;
    if (!canvas || !candlestickData.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = rect.width;
    const height = rect.height;
    const padding = 60;

    ctx.clearRect(0, 0, width, height);

    const allPrices = candlestickData.flatMap(d => [d.high, d.low]);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceRange = maxPrice - minPrice;

    const candleWidth = Math.max(2, (width - 2 * padding) / candlestickData.length * 0.8);

    candlestickData.forEach((candle, index) => {
      const x = padding + (index / (candlestickData.length - 1)) * (width - 2 * padding);
      const openY = height - padding - ((candle.open - minPrice) / priceRange) * (height - 2 * padding);
      const closeY = height - padding - ((candle.close - minPrice) / priceRange) * (height - 2 * padding);
      const highY = height - padding - ((candle.high - minPrice) / priceRange) * (height - 2 * padding);
      const lowY = height - padding - ((candle.low - minPrice) / priceRange) * (height - 2 * padding);

      const isGreen = candle.close > candle.open;
      
      // Draw wick
      ctx.strokeStyle = isGreen ? '#10B981' : '#EF4444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Draw body
      ctx.fillStyle = isGreen ? '#10B981' : '#EF4444';
      const bodyHeight = Math.abs(closeY - openY);
      const bodyY = Math.min(openY, closeY);
      
      ctx.fillRect(x - candleWidth / 2, bodyY, candleWidth, Math.max(1, bodyHeight));
    });
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      <div className="flex flex-col space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            {currency.toUpperCase()} Price Chart
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setChartType('line')}
              className={`p-2 rounded-lg transition-colors ${
                chartType === 'line' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Activity className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType('candlestick')}
              className={`p-2 rounded-lg transition-colors ${
                chartType === 'candlestick' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Timeframe buttons */}
          <div className="flex space-x-1">
            {timeframes.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setTimeframe(value)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  timeframe === value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Comparison selector */}
          <div className="flex space-x-1 ml-4">
            {comparisons.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setComparison(value)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  comparison === value
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                vs {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative h-80">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50 rounded-lg">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="w-full h-full rounded-lg"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
};