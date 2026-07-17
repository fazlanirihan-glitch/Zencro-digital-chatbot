'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, Loader2 } from 'lucide-react';

export type AIStatus = 'understanding' | 'thinking' | 'generating';

interface TypingIndicatorProps {
  status?: AIStatus;
}

function TypingIndicatorBase({ status = 'thinking' }: TypingIndicatorProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const getStatusContent = () => {
    switch (status) {
      case 'understanding':
        return { icon: Brain, text: 'Understanding your request', color: 'var(--brand-secondary)' };
      case 'thinking':
        return { icon: Sparkles, text: 'Thinking', color: 'var(--brand-primary)' };
      case 'generating':
        return { icon: Loader2, text: 'Generating response', color: 'var(--foreground)' };
      default:
        return { icon: Sparkles, text: 'Thinking', color: 'var(--brand-primary)' };
    }
  };

  const { icon: Icon, text, color } = getStatusContent();

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="flex gap-3 my-2 max-w-[85%] sm:max-w-[75%]"
    >
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: 'var(--brand-gradient)' }}
      >
        <Sparkles className="w-4 h-4 text-white" />
      </div>

      {/* Bubble */}
      <div
        className="rounded-2xl rounded-tl-md px-4 py-2.5 flex items-center gap-2"
        style={{
          background: 'var(--bubble-bot)',
          color: 'var(--bubble-bot-text)',
          border: '1px solid var(--border)',
        }}
        role="status"
        aria-label={`AI is ${text}`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={status}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2"
          >
            <Icon 
              className={`w-3.5 h-3.5 ${status === 'generating' ? 'animate-spin' : ''}`} 
              style={{ color }} 
            />
            <span
              className="text-xs leading-none select-none"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {text}{status !== 'generating' ? dots : ''}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

const TypingIndicator = React.memo(TypingIndicatorBase);
TypingIndicator.displayName = 'TypingIndicator';

export default TypingIndicator;
