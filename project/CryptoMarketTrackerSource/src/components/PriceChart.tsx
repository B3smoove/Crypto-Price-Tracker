import React, { useEffect, useRef } from 'react';
import { ChartData } from '../types/crypto';

interface PriceChartProps {
  data: ChartData[];
  currency: string;
}

export const PriceChart: React.FC<PriceChartProps> = ({ data, currency }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    // Avoid rendering when there's not enough data to plot a line
    if (!canvas || data.length < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = rect.width;
    const height = rect.height;
    const padding = 40;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate min/max prices
    const prices = data.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    // Prevent division by zero when all prices are identical
    const priceRange = maxPrice - minPrice || 1;

    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.1)');
    gradient.addColorStop(1, 'rgba(147, 51, 234, 0.1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw price line
    ctx.beginPath();
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 2;

    data.forEach((point, index) => {
      const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((point.price - minPrice) / priceRange) * (height - 2 * padding);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw area under the curve
    ctx.beginPath();
    const areaGradient = ctx.createLinearGradient(0, 0, 0, height);
    areaGradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
    areaGradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');
    ctx.fillStyle = areaGradient;

    data.forEach((point, index) => {
      const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
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
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'right';
    
    // Max price
    ctx.fillText(`$${maxPrice.toFixed(2)}`, width - 10, 20);
    
    // Min price
    ctx.fillText(`$${minPrice.toFixed(2)}`, width - 10, height - 10);

  }, [data]);

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      <h3 className="text-xl font-semibold text-white mb-4">
        {currency.toUpperCase()} Price Chart (7 Days)
      </h3>
      <div className="relative h-64">
        <canvas
          ref={canvasRef}
          className="w-full h-full rounded-lg"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
};