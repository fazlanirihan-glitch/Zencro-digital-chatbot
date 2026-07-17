'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { WifiOff, RefreshCw, AlertCircle, Clock } from 'lucide-react';

type ErrorType = 'network' | 'timeout' | 'server' | 'unknown';

interface ErrorStateProps {
  type?: ErrorType;
  message?: string;
  onRetry?: () => void;
}

const errorConfig: Record<ErrorType, { icon: React.ElementType; title: string; description: string }> = {
  network: {
    icon: WifiOff,
    title: "Connection lost",
    description: "I'm having trouble connecting right now. Please check your internet and try again.",
  },
  timeout: {
    icon: Clock,
    title: "Taking longer than expected",
    description: "The response is taking a while. This might be a temporary issue — please try again in a moment.",
  },
  server: {
    icon: AlertCircle,
    title: "Something went wrong",
    description: "I ran into a temporary issue on my end. Please try again in a moment.",
  },
  unknown: {
    icon: AlertCircle,
    title: "Oops, unexpected issue",
    description: "Something didn't go as planned. Let's try that again.",
  },
};

function ErrorState({ type = 'unknown', message, onRetry }: ErrorStateProps) {
  const config = errorConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 my-2 max-w-sm"
    >
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: 'rgba(239, 68, 68, 0.1)' }}
      >
        <Icon className="w-4 h-4 text-red-400" />
      </div>

      {/* Error card */}
      <div
        className="flex-1 rounded-2xl rounded-tl-md px-4 py-3"
        style={{
          background: 'var(--surface)',
          border: '1px solid rgba(239, 68, 68, 0.15)',
        }}
      >
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
          {config.title}
        </p>
        <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--foreground-muted)' }}>
          {message || config.description}
        </p>

        {onRetry && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRetry}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={{
              background: 'hsla(var(--brand-primary), 0.1)',
              color: 'hsl(var(--brand-primary))',
            }}
            aria-label="Retry the request"
          >
            <RefreshCw className="w-3 h-3" />
            Try again
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

export default React.memo(ErrorState);
