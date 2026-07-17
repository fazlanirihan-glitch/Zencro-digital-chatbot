'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Users, MessageSquare, Layers, Activity, Database, HardDrive, RefreshCw } from 'lucide-react';

interface Metrics {
  total_conversations: number;
  active_sessions: number;
  total_leads: number;
  today_leads: number;
  conversion_rate: number;
  avg_response_time_ms: number;
  system_health: string;
  database_health: string;
  total_companies: number;
  storage_usage_mb: number;
}

export default function DashboardHome() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const fetchMetrics = useCallback(async () => {
    try {
      const token = localStorage.getItem('zencro_admin_token');
      const res = await fetch(`${apiHost}/api/v1/analytics/dashboard-metrics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMetrics(await res.json());
      }
    } catch (e) {
      console.error("Failed to load metrics", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiHost]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchMetrics();
    }, 0);
    // Auto-refresh every 30 seconds for real-time feel
    const interval = setInterval(fetchMetrics, 30000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [fetchMetrics]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMetrics();
  };

  if (loading || !metrics) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 min-h-screen">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <span className="text-xs text-slate-400">Aggregating system metrics...</span>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 space-y-6 animate-fade-in-up">
      {/* Header Actions */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Platform Overview</h1>
          <span className="text-xs text-slate-400">Real-time system health and conversion metrics.</span>
        </div>
        <button 
          onClick={handleRefresh}
          className={`p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 ${refreshing ? 'animate-spin' : ''}`}
          title="Refresh Data"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* KPI Grid 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <MetricCard title="Total Leads (All Time)" value={metrics.total_leads.toString()} icon={<Users size={18} />} color="blue" />
        <MetricCard title="Today's Leads" value={metrics.today_leads.toString()} icon={<Users size={18} />} color="green" />
        <MetricCard title="Total Conversations" value={metrics.total_conversations.toString()} icon={<MessageSquare size={18} />} color="indigo" />
        <MetricCard title="Conversion Rate" value={`${metrics.conversion_rate}%`} icon={<Layers size={18} />} color="emerald" />
      </div>

      {/* KPI Grid 2: System Health */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <MetricCard title="Active Sessions" value={metrics.active_sessions.toString()} icon={<Activity size={18} />} color="pink" />
        <MetricCard title="Avg. AI Latency" value={`${metrics.avg_response_time_ms}ms`} icon={<Activity size={18} />} color="yellow" />
        <MetricCard title="Database Health" value={metrics.database_health} icon={<Database size={18} />} color={metrics.database_health === 'Healthy' ? 'green' : 'red'} />
        <MetricCard title="Knowledge Storage" value={`${metrics.storage_usage_mb} MB`} icon={<HardDrive size={18} />} color="slate" />
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, color }: { title: string, value: string, icon: React.ReactNode, color: string }) {
  const colorMap: Record<string, string> = {
    blue: "text-blue-400 bg-blue-900/20 border-blue-500/20",
    green: "text-green-400 bg-green-900/20 border-green-500/20",
    indigo: "text-indigo-400 bg-indigo-900/20 border-indigo-500/20",
    emerald: "text-emerald-400 bg-emerald-900/20 border-emerald-500/20",
    pink: "text-pink-400 bg-pink-900/20 border-pink-500/20",
    yellow: "text-yellow-400 bg-yellow-900/20 border-yellow-500/20",
    red: "text-red-400 bg-red-900/20 border-red-500/20",
    slate: "text-slate-400 bg-slate-900/20 border-slate-500/20"
  };

  return (
    <div className="bg-slate-950/40 border border-slate-900 p-5 rounded-2xl glassmorphism flex items-center justify-between">
      <div>
        <span className="text-[10px] text-slate-400 uppercase font-semibold">{title}</span>
        <h3 className="text-2xl font-bold text-slate-100 mt-1">{value}</h3>
      </div>
      <div className={`w-10 h-10 border rounded-xl flex items-center justify-center ${colorMap[color]}`}>
        {icon}
      </div>
    </div>
  );
}
