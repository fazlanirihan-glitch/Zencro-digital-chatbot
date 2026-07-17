'use client';

import React, { useCallback } from 'react';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion';
import {
  Globe,
  Bot,
  CreditCard,
  Briefcase,
  MessageSquare,
  Sparkles,
  Zap,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface SuggestionCategory {
  /** Human-readable label shown on the card header */
  label: string;
  /** Kebab-case icon key that maps to a lucide-react component */
  icon: string;
  /** Prompt strings displayed as clickable chips inside the card */
  prompts: string[];
}

export interface SuggestionsProps {
  /** Array of suggestion categories to render */
  categories: SuggestionCategory[];
  /** Callback fired when a prompt chip is clicked */
  onSelect: (prompt: string) => void;
  /** Controls mount / unmount with exit animation */
  visible: boolean;
}

/* ------------------------------------------------------------------ */
/*  Icon lookup                                                        */
/* ------------------------------------------------------------------ */

const ICON_MAP: Record<string, LucideIcon> = {
  globe: Globe,
  bot: Bot,
  'credit-card': CreditCard,
  briefcase: Briefcase,
  'message-square': MessageSquare,
  sparkles: Sparkles,
  zap: Zap,
  'help-circle': HelpCircle,
};

/**
 * Resolve an icon string to a Lucide component.
 * Falls back to `Sparkles` when the key is unrecognised.
 */
function resolveIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Sparkles;
}

/* ------------------------------------------------------------------ */
/*  Framer Motion variants                                             */
/* ------------------------------------------------------------------ */

const containerVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.08,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.94,
    transition: { duration: 0.25, ease: [0.4, 0, 1, 1] },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.05,
    },
  },
};

const chipVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
};

/* Reduced-motion fallbacks */
const reducedContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.01 } },
  exit: { opacity: 0, transition: { duration: 0.01 } },
};

const reducedChildVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.01 } },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const Suggestions: React.FC<SuggestionsProps> = ({ categories, onSelect, visible }) => {
  const prefersReduced = useReducedMotion();

  const activeContainer = prefersReduced ? reducedContainerVariants : containerVariants;
  const activeCard = prefersReduced ? reducedChildVariants : cardVariants;
  const activeChip = prefersReduced ? reducedChildVariants : chipVariants;

  const handleSelect = useCallback(
    (prompt: string) => () => {
      onSelect(prompt);
    },
    [onSelect],
  );

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          key="suggestions-container"
          variants={activeContainer}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="region"
          aria-label="Suggested prompts"
          className="grid w-full grid-cols-1 gap-4 md:grid-cols-2"
        >
          {categories.map((category) => {
            const Icon = resolveIcon(category.icon);

            return (
              <motion.div
                key={category.label}
                variants={activeCard}
                className="group relative flex flex-col gap-3 rounded-2xl p-4 transition-colors"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                }}
                aria-label={`${category.label} suggestions`}
              >
                {/* ---- Card header ---- */}
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      background: 'hsla(var(--brand-primary), 0.12)',
                    }}
                  >
                    <Icon
                      size={16}
                      className="text-primary"
                      aria-hidden="true"
                    />
                  </div>

                  <h3
                    className="text-sm font-semibold tracking-tight"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {category.label}
                  </h3>
                </div>

                {/* ---- Prompt chips ---- */}
                <div className="flex flex-wrap gap-2" role="list" aria-label={`${category.label} prompts`}>
                  {category.prompts.map((prompt) => (
                    <motion.button
                      key={prompt}
                      variants={activeChip}
                      type="button"
                      onClick={handleSelect(prompt)}
                      whileHover={
                        prefersReduced
                          ? undefined
                          : {
                              scale: 1.04,
                              boxShadow: '0 0 16px hsla(var(--brand-primary), 0.18)',
                            }
                      }
                      whileTap={prefersReduced ? undefined : { scale: 0.97 }}
                      role="listitem"
                      aria-label={`Select prompt: ${prompt}`}
                      className="cursor-pointer rounded-full px-3.5 py-1.5 text-left text-[0.8125rem] leading-snug backdrop-blur-md transition-colors"
                      style={{
                        background: 'var(--glass-bg)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--foreground-muted)',
                      }}
                    >
                      {prompt}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default React.memo(Suggestions);
