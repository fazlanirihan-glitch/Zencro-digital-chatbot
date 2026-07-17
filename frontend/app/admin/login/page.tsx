'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { Sparkles, Mail, Lock, LogIn, AlertCircle } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // If already logged in, redirect to dashboard
  useEffect(() => {
    const token = localStorage.getItem('zencro_admin_token');
    if (token) {
      router.push('/admin/dashboard');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    try {
      if (isSupabaseConfigured) {
        // Real Supabase Authentication
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (authError) {
          setError(authError.message);
          setLoading(false);
          return;
        }

        if (data?.session) {
          localStorage.setItem('zencro_admin_token', data.session.access_token);
          router.push('/admin/dashboard');
        }
      } else {
        // Mock Authentication for Demo
        setTimeout(() => {
          localStorage.setItem('zencro_admin_token', 'mock-admin-token');
          router.push('/admin/dashboard');
        }, 1000);
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message || 'An unexpected error occurred.');
      } else {
        setError('An unexpected error occurred.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col justify-center items-center px-6 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-[35%] h-[35%] rounded-full bg-blue-600/5 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[35%] h-[35%] rounded-full bg-indigo-600/5 blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-950/65 border border-slate-900 rounded-3xl p-8 sm:p-10 shadow-2xl glassmorphism z-10 text-center">
        {/* Brand logo */}
        <div className="flex justify-center items-center space-x-2.5 mb-8">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <Sparkles size={18} />
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
            ZenCro Admin
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Welcome Back</h2>
        <p className="text-xs text-slate-400 mb-6">Log in to manage leads, view transcripts, and FAQ files.</p>

        {/* Demo banner */}
        {!isSupabaseConfigured && (
          <div className="mb-6 p-3.5 bg-blue-950/20 border border-blue-900/30 rounded-2xl flex items-start space-x-2 text-left animate-fade-in-up">
            <AlertCircle className="text-blue-400 flex-shrink-0 mt-0.5" size={14} />
            <p className="text-[10px] text-blue-300 leading-normal">
              <strong>Running in Demo Mode:</strong> Supabase keys are not set. You can sign in using any mock email and password (e.g. <code>rihan@zencro.com</code>).
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-3.5 bg-red-950/20 border border-red-900/30 rounded-2xl flex items-center space-x-2 text-left">
            <AlertCircle className="text-red-400 flex-shrink-0" size={14} />
            <p className="text-[10.5px] text-red-300">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div>
            <label className="block text-[11px] text-slate-400 font-medium mb-1.5">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><Mail size={14} /></span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500 placeholder-slate-600"
                placeholder="admin@zencrodigital.in"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 font-medium mb-1.5">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><Lock size={14} /></span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500 placeholder-slate-600"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold text-xs rounded-xl py-3 mt-4 transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/10"
          >
            {loading ? (
              <span>Logging in...</span>
            ) : (
              <>
                <LogIn size={14} />
                <span>Log In</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
