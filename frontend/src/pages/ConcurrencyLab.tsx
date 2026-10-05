import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Server, Database, RefreshCw } from 'lucide-react';

export default function ConcurrencyLab() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<{ req: number, res: number, rej: number } | null>(null);

  const runSim = () => {
    setRunning(true);
    setResults(null);
    
    // Simulate 10,000 requests taking 3 seconds to process
    setTimeout(() => {
      setResults({ req: 10000, res: 100, rej: 9900 });
      setRunning(false);
    }, 3000);
  };

  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-8 pb-32">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
           <Zap className="text-brand-primary" size={32} /> Concurrency Lab
        </h1>
        <p className="text-slate-400">What happens when 10,000 customers try to buy 100 units?</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Controls */}
         <div className="dashboard-card p-8 h-fit">
            <h2 className="font-bold text-white mb-6 uppercase tracking-widest text-sm text-slate-500">Simulation Parameters</h2>
            
            <div className="space-y-6">
               <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Concurrent Users</label>
                  <div className="bg-brand-bg border border-brand-border p-3 rounded mt-2 font-mono text-white text-lg">10,000</div>
               </div>
               <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Available Inventory</label>
                  <div className="bg-brand-bg border border-brand-border p-3 rounded mt-2 font-mono text-brand-primary text-lg">100</div>
               </div>
               
               <button 
                 onClick={runSim} 
                 disabled={running}
                 className="primary-btn w-full py-4 text-lg mt-8"
               >
                 {running ? <RefreshCw className="animate-spin" size={24}/> : <Zap size={24}/>}
                 RUN SIMULATION
               </button>
            </div>
         </div>

         {/* Visualizer & Results */}
         <div className="lg:col-span-2 space-y-8">
            <div className="dashboard-card p-10 min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden">
               
               {!running && !results && (
                  <div className="text-center opacity-50">
                     <Database size={64} className="mx-auto mb-4 text-slate-600" />
                     <p className="font-mono text-slate-400">Awaiting simulation trigger...</p>
                  </div>
               )}

               {running && (
                  <div className="flex flex-col items-center w-full">
                     <h2 className="text-xl font-bold text-brand-primary mb-8 animate-pulse">Processing 10,000 Requests...</h2>
                     <div className="flex w-full items-center justify-between px-12 relative">
                        <div className="w-16 h-16 bg-brand-bg border-2 border-slate-700 rounded-full flex items-center justify-center z-10"><Server className="text-slate-400"/></div>
                        
                        {/* Animated particles */}
                        <div className="absolute left-24 right-24 h-1 bg-slate-800 top-1/2 -translate-y-1/2 rounded-full overflow-hidden">
                           <motion.div 
                             animate={{ x: ["-100%", "100%"] }} 
                             transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                             className="w-1/2 h-full bg-gradient-to-r from-transparent via-brand-primary to-transparent"
                           />
                        </div>

                        <div className="w-24 h-24 bg-brand-surface-2 border-2 border-brand-primary rounded-xl flex items-center justify-center z-10 shadow-[0_0_30px_rgba(14,165,233,0.3)]">
                           <Database className="text-brand-primary" size={32}/>
                        </div>
                     </div>
                  </div>
               )}

               <AnimatePresence>
                 {results && (
                   <motion.div initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} className="w-full text-center z-10 bg-brand-surface">
                      <div className="grid grid-cols-2 gap-4 mb-8">
                         <div className="bg-brand-bg border border-brand-border p-6 rounded-xl">
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Requests Processed</p>
                            <p className="text-4xl font-black text-white">{results.req.toLocaleString()}</p>
                         </div>
                         <div className="bg-brand-bg border border-brand-border p-6 rounded-xl">
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Successful Sales</p>
                            <p className="text-4xl font-black text-brand-primary">{results.res}</p>
                         </div>
                      </div>
                      
                      <div className="bg-brand-bg border border-brand-danger/30 p-4 rounded-xl mb-8">
                         <p className="text-brand-danger font-bold uppercase tracking-widest text-sm mb-1">Rejected / Failed</p>
                         <p className="text-2xl font-black text-brand-danger">{results.rej.toLocaleString()}</p>
                      </div>

                      <div className="bg-brand-success/10 border border-brand-success/50 p-8 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                         <h2 className="text-6xl font-black text-brand-success drop-shadow-lg mb-2">0</h2>
                         <p className="text-xl font-bold text-brand-success uppercase tracking-widest">OVERSELLING</p>
                      </div>
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
         </div>
      </div>
    </div>
  );
}
