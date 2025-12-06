import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { 
  cardFlyInVariants, 
  pulseVariants, 
  successIconVariants, 
  errorIconVariants,
  blinkVariants 
} from '../utils/animations';

export type ProcessingStatus = 'pending' | 'processing' | 'success' | 'error' | 'warning';

interface ProcessingCardProps {
  fileName: string;
  status: ProcessingStatus;
  message?: string;
  index?: number;
  onRetry?: () => void;
}

const ProcessingCard: React.FC<ProcessingCardProps> = ({
  fileName,
  status,
  message,
  index = 0,
  onRetry,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          icon: null,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-600',
          iconColor: 'text-gray-400',
        };
      case 'processing':
        return {
          icon: Loader2,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-700',
          iconColor: 'text-blue-500',
        };
      case 'success':
        return {
          icon: CheckCircle2,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-700',
          iconColor: 'text-green-500',
        };
      case 'error':
        return {
          icon: XCircle,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-700',
          iconColor: 'text-red-500',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-700',
          iconColor: 'text-yellow-500',
        };
      default:
        return {
          icon: null,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-600',
          iconColor: 'text-gray-400',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <motion.div
      variants={cardFlyInVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      custom={index}
      className={`
        border-2 rounded-lg p-4 mb-3
        ${config.bgColor} ${config.borderColor}
        transition-all duration-200
      `}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          {status === 'processing' && Icon ? (
            <motion.div
              variants={pulseVariants}
              animate="pulse"
            >
              <Icon className={config.iconColor} size={24} />
            </motion.div>
          ) : status === 'success' && Icon ? (
            <motion.div
              variants={successIconVariants}
              initial="hidden"
              animate="visible"
            >
              <Icon className={config.iconColor} size={24} />
            </motion.div>
          ) : status === 'error' && Icon ? (
            <motion.div
              variants={errorIconVariants}
              initial="hidden"
              animate="visible"
            >
              <Icon className={config.iconColor} size={24} />
            </motion.div>
          ) : status === 'warning' && Icon ? (
            <motion.div
              variants={blinkVariants}
              animate="blink"
            >
              <Icon className={config.iconColor} size={24} />
            </motion.div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-200" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${config.textColor}`}>
            {fileName}
          </p>
          {message && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-xs mt-1 ${config.textColor} opacity-80`}
            >
              {message}
            </motion.p>
          )}
        </div>

        {/* Retry Button (for error status) */}
        {status === 'error' && onRetry && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRetry}
            className="text-xs text-red-600 hover:text-red-700 font-medium px-3 py-1 border border-red-300 rounded-md hover:bg-red-100 transition-colors"
          >
            Retry
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default ProcessingCard;

