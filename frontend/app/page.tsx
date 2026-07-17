'use client';

import dynamic from 'next/dynamic';

// Lazy load the ChatWidget for performance
const ChatWidget = dynamic(() => import('@/components/ChatWidget'), {
  ssr: false,
  loading: () => null,
});

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-[0.03] blur-[100px]"
          style={{ background: 'hsl(var(--brand-primary))' }}
        />
        <div
          className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-[0.03] blur-[100px]"
          style={{ background: 'hsl(var(--brand-secondary))' }}
        />
        <div
          className="absolute top-[40%] left-[50%] w-[400px] h-[400px] rounded-full opacity-[0.02] blur-[80px] -translate-x-1/2"
          style={{ background: 'var(--brand-gradient)' }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
        aria-hidden="true"
      />

      {/* Hero content */}
      <div className="relative z-10 text-center px-6 max-w-2xl animate-fade-in-up">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
          style={{
            background: 'hsla(var(--brand-primary), 0.08)',
            color: 'hsl(var(--brand-primary))',
            border: '1px solid hsla(var(--brand-primary), 0.12)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          AI Assistant Online
        </div>

        <h1
          className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 tracking-tight font-[family-name:var(--font-display)]"
          style={{ color: 'var(--foreground)' }}
        >
          Build.{' '}
          <span
            className="bg-clip-text text-transparent animate-gradient"
            style={{
              backgroundImage: 'var(--brand-gradient)',
              backgroundSize: '200% 200%',
            }}
          >
            Automate.
          </span>{' '}
          Grow.
        </h1>

        <p
          className="text-base sm:text-lg max-w-lg mx-auto mb-8 leading-relaxed"
          style={{ color: 'var(--foreground-muted)' }}
        >
          Premium web development, intelligent AI automation, and scalable digital solutions for modern businesses.
        </p>

        {/* CTA prompt */}
        <p
          className="text-sm flex items-center justify-center gap-2"
          style={{ color: 'var(--foreground-muted)' }}
        >
          <span className="inline-block w-6 h-[1px]" style={{ background: 'var(--border)' }} />
          Click the chat button to get started
          <span className="inline-block w-6 h-[1px]" style={{ background: 'var(--border)' }} />
        </p>
      </div>

      {/* Chat Widget */}
      <ChatWidget />
    </main>
  );
}
