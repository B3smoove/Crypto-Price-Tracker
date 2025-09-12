import React from 'react';
import { Brain, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { PredictionData } from '../types/crypto';

interface PredictionCardProps {
  prediction: PredictionData;
  currentPrice: number;
}

export const PredictionCard: React.FC<PredictionCardProps> = ({ 
  prediction, 
  currentPrice 
}) => {
  const priceDiff = prediction.prediction - currentPrice;
  const percentChange = (priceDiff / currentPrice) * 100;
  
  const getTrendIcon = () => {
    switch (prediction.trend) {
      case 'bullish':
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'bearish':
        return <TrendingDown className="w-5 h-5 text-red-400" />;
      default:
        return <Minus className="w-5 h-5 text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    switch (prediction.trend) {
      case 'bullish':
        return 'text-green-400';
      case 'bearish':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const confidenceColor = prediction.confidence > 0.8 
    ? 'text-green-400' 
    : prediction.confidence > 0.6 
      ? 'text-yellow-400' 
      : 'text-red-400';

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">AI Prediction</h3>
            <p className="text-gray-400 text-sm">{prediction.timeframe} forecast</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {getTrendIcon()}
          <span className={`font-semibold ${getTrendColor()}`}>
            {prediction.trend.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-400 text-sm">Predicted Price</p>
            <p className="text-2xl font-bold text-white">
              ${prediction.prediction.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Expected Change</p>
            <p className={`text-2xl font-bold ${percentChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {percentChange > 0 ? '+' : ''}{percentChange.toFixed(2)}%
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-sm">Confidence Level</span>
          <div className="flex items-center space-x-2">
            <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-300`}
                style={{ width: `${prediction.confidence * 100}%` }}
              />
            </div>
            <span className={`font-semibold ${confidenceColor}`}>
              {(prediction.confidence * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <p className="text-gray-300 text-sm">
            <span className="font-semibold">Analysis:</span> Based on market trends, 
            technical indicators, and historical patterns, the AI model predicts a{' '}
            <span className={getTrendColor()}>{prediction.trend}</span> movement 
            with {(prediction.confidence * 100).toFixed(0)}% confidence.
          </p>
        </div>
      </div>
    </div>
  );
};