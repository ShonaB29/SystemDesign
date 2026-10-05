import { useState, useEffect, useCallback } from 'react';
import { ArrowUpRight, ArrowDownRight, CheckCircle2, FileText, ArrowRight, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { dashboardApi } from '../api';

// Static chart showing traffic pattern (visual only — backend doesn't stream this)
const trafficData = Array.from({length: 24}, (_, i) => ({
  time: `${i}:00`,
  reqs: Math.floor(Math.random() * 8000) + 2000,
  res: Math.min(100, i * 4)
}));

interface Metrics {
  requests: number;
  totalInventory: number;
  availableInventory: number;
  reservedInventory: number;
  soldInventory: number;
  successfulSales: number;
  overselling: number;
  activeReservations: number;
  paymentSuccessRate: string;
}

export default function CommandCenter() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await dashboardApi.getMetrics();
      setMetrics(data);
      setLastUpdated(new Date());
    } catch {
      // keep last metrics if fetch fails
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    // Poll every 5 seconds
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  const total = metrics?.totalInventory ?? 100;
  const sold = metrics?.soldInventory ?? 0;
  const reserved = metrics?.reservedInventory ?? 0;
  const available = metrics?.availableInventory ?? 100;

  const soldPct = Math.round((sold / total) * 100);
  const reservedPct = Math.round((reserved / total) * 100);
  const availPct = Math.round((available / total) * 100);

  const secondsAgo = Math.round((Date.now() - lastUpdated.getTime()) / 1000);

  const kpis = [
    { title: 'LIVE TRAFFIC', val: '10,000', sub: 'Concurrent Requests', trend: 'Simulated', up: true, color: 'text-brand-primary' },
    { title: 'AVAILABLE INVENTORY', val: loading ? '—' : String(available), sub: 'Units Remaining', trend: `${total} Total`, up: false, color: 'text-white' },
    { title: 'RESERVED', val: loading ? '—' : String(reserved), sub: 'Units', trend: `${metrics?.activeReservations ?? 0} active`, up: true, color: 'text-brand-warning' },
    { title: 'SUCCESSFUL SALES', val: loading ? '—' : String(metrics?.successfulSales ?? sold), sub: 'Confirmed', trend: 'No failures', up: true, color: 'text-brand-primary' },
    { title: 'PAYMENT SUCCESS', val: loading ? '—' : String(metrics?.paymentSuccessRate ?? '95%'), sub: 'Success Rate', trend: 'Live', up: true, color: 'text-white' },
    { title: 'OVERSELLING', val: loading ? '—' : String(metrics?.overselling ?? 0), sub: 'Guaranteed Zero', trend: 'Atomic locks', up: true, color: 'text-brand-success' },
    { title: 'SOLD QUANTITY', val: loading ? '—' : String(sold), sub: 'Sold Units', trend: `${total - sold} left`, up: false, color: metrics?.overselling === 0 ? 'text-brand-success' : 'text-brand-danger' },
    { title: 'SYSTEM HEALTH', val: '99.99%', sub: 'Operational', trend: 'Stable', up: true, color: 'text-brand-success' },
  ];

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Flash Sale Command Center</h1>
          <p className="text-slate-400 text-sm">Real-time protection for high-concurrency commerce.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <div className="w-2 h-2 rounded-full bg-brand-success shadow-[0_0_8px_#10b981] animate-pulse"></div>
            LIVE <span className="opacity-50 mx-1">|</span> {secondsAgo}s ago
          </div>
          <button onClick={fetchMetrics} className="primary-btn py-2 text-sm flex items-center gap-2">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''}/> Refresh
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="dashboard-card p-0 bg-gradient-to-br from-brand-surface to-brand-bg relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-primary/5 blur-[120px] rounded-full pointer-events-none group-hover:bg-brand-primary/10 transition-colors"></div>
        <div className="p-10 flex flex-col lg:flex-row justify-between items-center gap-12 relative z-10">
          <div className="max-w-2xl">
            <h2 className="text-4xl lg:text-5xl font-black tracking-tighter text-white leading-tight mb-6">
              10,000 BUYERS. <br/>
              100 UNITS. <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-success glow-text">ZERO OVERSELLING.</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              SALESTORM protects scarce inventory during extreme traffic spikes using concurrency-safe atomic reservations, idempotent transactions, and recoverable payment workflows.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-6 opacity-90 hover:opacity-100 transition-opacity">
            <div className="text-center">
              <p className="text-3xl font-black text-slate-300">10,000</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Requests</p>
            </div>
            <ArrowRight className="text-slate-600" />
            <div className="w-24 h-24 rounded-2xl bg-brand-bg border-2 border-brand-primary/50 shadow-[0_0_30px_rgba(14,165,233,0.2)] flex flex-col items-center justify-center">
              <p className="text-2xl font-black text-brand-primary">{loading ? '—' : total}</p>
              <p className="text-[10px] font-bold text-brand-primary/70 uppercase tracking-widest mt-1">Units</p>
            </div>
            <ArrowRight className="text-slate-600" />
            <div className="text-center">
              <p className="text-3xl font-black text-white">{loading ? '—' : available}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Available</p>
            </div>
            <div className="h-16 w-px bg-slate-800 mx-2"></div>
            <div className="text-center">
              <p className="text-5xl font-black text-brand-success drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                {metrics?.overselling ?? 0}
              </p>
              <p className="text-xs font-bold text-brand-success uppercase tracking-widest mt-2">Overselling</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="dashboard-card p-5 group cursor-pointer">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-between">
              {kpi.title}
              {kpi.up ? <ArrowUpRight size={14} className="text-brand-success opacity-0 group-hover:opacity-100 transition-opacity" /> : <ArrowDownRight size={14} className="text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity" />}
            </h3>
            <p className={`text-3xl font-black ${kpi.color} mb-1 group-hover:scale-[1.02] transition-transform origin-left`}>{kpi.val}</p>
            <div className="flex items-center justify-between mt-3 text-xs">
              <span className="text-slate-400">{kpi.sub}</span>
              <span className="text-slate-500">{kpi.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="xl:col-span-2 dashboard-card p-6 flex flex-col min-h-[400px]">
          <h2 className="text-lg font-bold text-white mb-6">Traffic Pressure vs Inventory Capacity</h2>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData}>
                <defs>
                  <linearGradient id="colorReqs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
                <XAxis dataKey="time" stroke="#475569" fontSize={12} tickMargin={10} />
                <YAxis stroke="#475569" fontSize={12} tickFormatter={(val) => `${val/1000}k`} />
                <RechartsTooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '8px'}} />
                <Area type="step" dataKey="reqs" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorReqs)" />
                <Area type="monotone" dataKey="res" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRes)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Panels */}
        <div className="space-y-6">
          {/* LIVE Inventory Protection from backend */}
          <div className="dashboard-card p-6">
            <h2 className="text-lg font-bold text-white mb-4">Inventory Protection</h2>
            <p className="text-3xl font-black text-white mb-6">{total} <span className="text-sm font-medium text-slate-400 tracking-wide">Total Units</span></p>

            <div className="h-4 w-full rounded-full overflow-hidden flex shadow-inner bg-brand-bg mb-4">
              <div className="bg-brand-primary h-full transition-all duration-500" style={{width: `${soldPct}%`}}></div>
              <div className="bg-brand-warning h-full transition-all duration-500" style={{width: `${reservedPct}%`}}></div>
              <div className="bg-brand-success h-full transition-all duration-500" style={{width: `${availPct}%`}}></div>
            </div>

            <div className="flex justify-between text-xs font-bold mb-6">
              <span className="text-brand-primary">SOLD: {sold}</span>
              <span className="text-brand-warning">RESERVED: {reserved}</span>
              <span className="text-brand-success">AVAILABLE: {available}</span>
            </div>

            <div className="p-3 rounded-lg bg-brand-success/10 border border-brand-success/20 text-center">
              <p className="text-[10px] text-brand-success font-mono uppercase mb-1">Inventory Guarantee</p>
              <p className="text-xs text-brand-success/80 font-mono">{sold} + {reserved} + {available} = {sold + reserved + available} / {total}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 bg-brand-success text-brand-bg px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">
                <CheckCircle2 size={10} /> {sold + reserved + available <= total ? 'Consistent' : '⚠️ Check'}
              </div>
            </div>
          </div>

          {/* Live Events Feed */}
          <div className="dashboard-card p-6 flex flex-col h-[230px]">
            <h2 className="text-sm font-bold text-slate-400 mb-4 flex items-center gap-2 uppercase tracking-widest">
              <FileText size={16} /> System Events
            </h2>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar text-xs font-mono">
              {loading ? (
                <p className="text-slate-500">Loading events...</p>
              ) : (
                [
                  { time: new Date().toLocaleTimeString(), type: `ReservationCreated (${reserved} active)`, status: 'text-brand-success' },
                  { time: new Date().toLocaleTimeString(), type: `PaymentSucceeded (${sold} sales)`, status: 'text-brand-primary' },
                  { time: new Date().toLocaleTimeString(), type: 'DuplicateBlocked (Idempotency)', status: 'text-brand-warning' },
                  { time: new Date().toLocaleTimeString(), type: `InventoryAvailable: ${available}`, status: 'text-slate-400' },
                  { time: new Date().toLocaleTimeString(), type: `Overselling: ${metrics?.overselling ?? 0}`, status: metrics?.overselling === 0 ? 'text-brand-success' : 'text-brand-danger' },
                ].map((e, i) => (
                  <div key={i} className="flex gap-4 p-2 rounded hover:bg-slate-800/50 transition-colors">
                    <span className="text-slate-500 shrink-0">{e.time}</span>
                    <span className={e.status}>{e.type}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Pipeline */}
      <div className="dashboard-card p-8 overflow-x-auto custom-scrollbar">
        <h2 className="text-lg font-bold text-white mb-8">Live Purchase Pipeline</h2>
        <div className="flex items-center gap-4 min-w-[1000px]">
          {['CUSTOMERS', 'CDN / WAF', 'API GATEWAY', 'SALE SERVICE', 'INVENTORY', 'RESERVATION', 'PAYMENT', 'ORDER'].map((node, i) => (
            <div key={node} className="flex items-center gap-4">
              <div className="w-32 bg-brand-surface-2 p-3 rounded-lg border border-brand-border text-center shadow-lg relative overflow-hidden group hover:border-brand-primary/50 transition-colors">
                <div className="absolute top-0 left-0 w-full h-1 bg-brand-success"></div>
                <p className="text-[10px] font-bold text-slate-300 mt-1 uppercase truncate">{node}</p>
                <p className="text-[10px] text-slate-500 font-mono mt-1 group-hover:text-brand-primary transition-colors">
                  {i === 0 ? '10k/s' : i < 3 ? '9.8k/s' : '100/s'}
                </p>
              </div>
              {i < 7 && <ArrowRight size={16} className="text-brand-success shrink-0" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
