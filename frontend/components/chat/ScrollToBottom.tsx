'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

interface ScrollToBottomProps {
  visible: boolean;
  onClick: () => void;
  unreadCount?: number;
}

function ScrollToBottom({ visible, onClick, unreadCount = 0 }: ScrollToBottomProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          onClick={onClick}
          className="absolute bottom-20 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--foreground-muted)',
            boxShadow: 'var(--shadow-md)',
          }}
          aria-label={`Scroll to bottom${unreadCount > 0 ? `, ${unreadCount} new messages` : ''}`}
        >
          <ArrowDown className="w-3.5 h-3.5" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center px-1"
              style={{ background: 'hsl(var(--brand-primary))' }}
            >
              {unreadCount}
            </span>
          )}
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export default React.memo(ScrollToBottom);
