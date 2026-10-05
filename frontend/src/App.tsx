import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Server, Shield, Zap, AlertTriangle, Search, Bell, UserCircle, Hexagon } from 'lucide-react';
import CommandCenter from './pages/CommandCenter';
import FlashSale from './pages/FlashSale';
import Architecture from './pages/Architecture';
import Reliability from './pages/Reliability';
import ConcurrencyLab from './pages/ConcurrencyLab';
import FailureSimulator from './pages/FailureSimulator';

const Placeholder = ({title}: {title: string}) => <div className="p-8 text-white"><h1 className="text-3xl font-bold">{title}</h1><p className="text-slate-400 mt-4">Module loaded. Enterprise telemetry online.</p></div>;

function Sidebar() {
  return (
    <aside className="w-[260px] bg-brand-surface border-r border-brand-border h-screen flex flex-col shrink-0 relative z-20">
      {/* Brand */}
      <div className="h-16 px-6 flex flex-col justify-center border-b border-brand-border bg-brand-bg/50">
        <div className="flex items-center gap-2">
           <Hexagon size={24} className="text-brand-primary" fill="currentColor" fillOpacity={0.2} />
           <span className="font-black text-xl tracking-tight text-white">SALESTORM</span>
        </div>
        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-0.5">Reliability Platform</p>
      </div>
      
      {/* Status */}
      <div className="px-6 py-4 flex items-center gap-2 border-b border-brand-border/50 bg-brand-bg/20">
         <div className="w-2 h-2 rounded-full bg-brand-success shadow-[0_0_8px_#10b981] animate-pulse"></div>
         <span className="text-[11px] font-bold text-brand-success uppercase tracking-widest">System Operational</span>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 custom-scrollbar">
        
        <div>
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-3">Overview</h3>
          <NavLink to="/" className={({isActive}) => `nav-btn ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={16} /> Command Center
          </NavLink>
        </div>

        <div>
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-3">Customer</h3>
          <NavLink to="/flash-sale" className={({isActive}) => `nav-btn ${isActive ? 'active' : ''}`}>
            <ShoppingBag size={16} /> Flash Sale
          </NavLink>
        </div>

        <div>
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-3">Engineering</h3>
          <div className="space-y-1">
             <NavLink to="/architecture" className={({isActive}) => `nav-btn ${isActive ? 'active' : ''}`}><Server size={16} /> Architecture</NavLink>
             <NavLink to="/reliability" className={({isActive}) => `nav-btn ${isActive ? 'active' : ''}`}><Shield size={16} /> Reliability</NavLink>
          </div>
        </div>

        <div>
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-3">Simulation</h3>
          <div className="space-y-1">
             <NavLink to="/concurrency-lab" className={({isActive}) => `nav-btn ${isActive ? 'active' : ''}`}><Zap size={16} /> Concurrency Lab</NavLink>
             <NavLink to="/failure-simulator" className={({isActive}) => `nav-btn ${isActive ? 'active' : ''}`}><AlertTriangle size={16} /> Failure Simulator</NavLink>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-brand-border bg-brand-surface-2 flex flex-col gap-4">
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-success shadow-[0_0_8px_#10b981]"></div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">All systems operational</span>
         </div>
      </div>
    </aside>
  );
}

function TopHeader() {
  return (
    <header className="h-16 glass-header flex items-center justify-between px-8 z-10">
      <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
        <span className="hover:text-white cursor-pointer transition-colors">SALESTORM</span>
        <span className="text-slate-600">/</span>
        <span className="text-white">Command Center</span>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="relative group">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search systems, services, events..." 
            className="bg-brand-bg border border-brand-border rounded-md pl-9 pr-4 py-1.5 text-sm w-64 focus:outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/50 text-white placeholder:text-slate-500 transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500 border border-slate-700 px-1 rounded">⌘K</div>
        </div>
        
        <div className="flex items-center gap-4 text-slate-400">
           <Bell size={18} className="cursor-pointer hover:text-white transition-colors" />
           <div className="bg-brand-primary/20 text-brand-primary border border-brand-primary/30 px-2 py-0.5 rounded text-xs font-bold">PROD</div>
           <UserCircle size={24} className="cursor-pointer hover:text-white transition-colors" />
        </div>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <Router>
      <div className="flex h-screen bg-brand-bg text-slate-100 font-sans overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 relative z-0">
          <TopHeader />
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<CommandCenter />} />
              <Route path="/flash-sale" element={<FlashSale />} />
              <Route path="/architecture" element={<Architecture />} />
              <Route path="/reliability" element={<Reliability />} />
              <Route path="/concurrency-lab" element={<ConcurrencyLab />} />
              <Route path="/failure-simulator" element={<FailureSimulator />} />
              <Route path="*" element={<Placeholder title="Under Construction" />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}
