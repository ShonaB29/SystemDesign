import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Database, CreditCard, Fingerprint, AlertTriangle, XCircle } from 'lucide-react';

type Tab = 'INVENTORY' | 'RESERVATIONS' | 'PAYMENT' | 'ORDER' | 'RECOVERY';

export default function Reliability() {
  const [activeTab, setActiveTab] = useState<Tab>('INVENTORY');

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 pb-32">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
           <ShieldCheck className="text-brand-success" size={32} /> Reliability & Consistency
        </h1>
        <p className="text-slate-400">State machines, idempotency, and failure recovery protocols.</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-brand-border">
         {(['INVENTORY', 'RESERVATIONS', 'PAYMENT', 'ORDER', 'RECOVERY'] as Tab[]).map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-sm font-bold tracking-widest uppercase transition-colors relative ${activeTab === tab ? 'text-brand-success' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {tab}
              {activeTab === tab && <motion.div layoutId="rel-tab" className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-success shadow-[0_0_10px_rgba(16,185,129,0.5)]"></motion.div>}
            </button>
         ))}
      </div>

      <AnimatePresence mode="wait">
        {/* INVENTORY TAB */}
        {activeTab === 'INVENTORY' && (
          <motion.div key="inv" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} className="space-y-8">
             <div className="dashboard-card p-10 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5"><Database size={200}/></div>
                <h2 className="text-xl font-bold text-white mb-8">Strict Consistency Guarantee</h2>
                <div className="bg-brand-success/10 border border-brand-success/30 text-brand-success p-6 rounded-2xl max-w-2xl mx-auto font-mono text-lg shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                   Available + Reserved + Sold ≤ Total
                </div>
                <p className="text-slate-400 mt-6 max-w-2xl mx-auto">
                   Inventory is gated by an atomic Lua script in Redis. Even under extreme contention (e.g. 10,000 customers fighting for 1 remaining unit), the atomic operation guarantees exactly 1 success and 9,999 failures.
                </p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="dashboard-card p-6">
                   <h3 className="font-bold text-white mb-4 border-b border-brand-border pb-4">Concurrency Control (The Last Item Problem)</h3>
                   <div className="bg-slate-900 p-4 rounded font-mono text-xs text-brand-primary border border-slate-700">
                      <p className="text-brand-warning">-- Atomic conditional update</p>
                      <p>UPDATE inventory</p>
                      <p>SET available = available - 1,</p>
                      <p className="pl-4">reserved = reserved + 1</p>
                      <p>WHERE product_id = $1</p>
                      <p>AND available {'>='} 1;</p>
                   </div>
                   <p className="text-xs text-slate-400 mt-4">If two requests hit the DB at the exact same millisecond, row-level locking ensures only one succeeds.</p>
                </div>
                <div className="dashboard-card p-6">
                   <h3 className="font-bold text-white mb-4 border-b border-brand-border pb-4">Data Mapping</h3>
                   <div className="space-y-3 font-mono text-sm">
                      <div className="flex justify-between border-b border-slate-800 pb-2"><span className="text-slate-500">Total</span><span className="text-white">100</span></div>
                      <div className="flex justify-between border-b border-slate-800 pb-2"><span className="text-brand-success">Available</span><span className="text-white">0</span></div>
                      <div className="flex justify-between border-b border-slate-800 pb-2"><span className="text-brand-warning">Reserved</span><span className="text-white">18</span></div>
                      <div className="flex justify-between border-b border-slate-800 pb-2"><span className="text-brand-primary">Sold</span><span className="text-white">82</span></div>
                   </div>
                </div>
             </div>
          </motion.div>
        )}

        {/* RESERVATIONS TAB */}
        {activeTab === 'RESERVATIONS' && (
          <motion.div key="res" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} className="space-y-8">
             <div className="dashboard-card p-10">
                <h2 className="text-lg font-bold text-white mb-8 border-b border-brand-border pb-4">Reservation Lifecycle (State Machine)</h2>
                
                <div className="flex flex-col items-center gap-4 font-mono text-xs max-w-lg mx-auto">
                   <div className="bg-brand-success/20 border border-brand-success text-brand-success px-8 py-2 rounded shadow-lg">AVAILABLE</div>
                   <div className="text-slate-500">↓ (reserve)</div>
                   <div className="bg-brand-warning/20 border border-brand-warning text-brand-warning px-8 py-2 rounded shadow-lg">RESERVED</div>
                   
                   <div className="flex w-full items-start justify-center gap-12 mt-2">
                      <div className="flex flex-col items-center">
                         <div className="text-brand-primary mb-2">↓ (checkout)</div>
                         <div className="bg-brand-primary/20 border border-brand-primary text-brand-primary px-8 py-2 rounded shadow-lg">PAYMENT_PENDING</div>
                         <div className="text-brand-primary my-2">↓ (success)</div>
                         <div className="bg-brand-success border border-brand-success text-brand-bg px-8 py-2 rounded shadow-lg font-black tracking-widest">SOLD</div>
                      </div>
                      
                      <div className="flex flex-col items-center border-l border-dashed border-slate-700 pl-12">
                         <div className="text-brand-danger mb-2">↓ (timeout / failure)</div>
                         <div className="bg-brand-danger/20 border border-brand-danger text-brand-danger px-8 py-2 rounded shadow-lg">RELEASED</div>
                         <div className="text-slate-500 text-[10px] mt-4 max-w-[150px] text-center">Reverts inventory back to AVAILABLE</div>
                      </div>
                   </div>
                </div>
             </div>
          </motion.div>
        )}

        {/* PAYMENT TAB */}
        {activeTab === 'PAYMENT' && (
          <motion.div key="pay" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} className="space-y-8">
             <div className="dashboard-card p-10">
                <h2 className="text-lg font-bold text-white mb-8 border-b border-brand-border pb-4 flex items-center gap-2"><Fingerprint size={18} className="text-purple-400"/> Idempotency Map</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <p className="text-slate-400 text-sm">To prevent double-charging a customer due to network retries, all Payment API calls require an <code className="text-purple-400 font-mono">Idempotency-Key</code> header.</p>
                      
                      <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg font-mono text-xs space-y-3">
                         <div className="text-slate-300">Request 1 (Success)</div>
                         <div className="text-brand-success pl-4">→ Process Charge</div>
                         <div className="text-brand-success pl-4">→ Cache Result (Key: <span className="text-purple-400">abc-123</span>)</div>
                         
                         <div className="text-slate-300 mt-6">Request 2 (Duplicate Retry)</div>
                         <div className="text-purple-400 pl-4">→ Key <span className="text-purple-400">abc-123</span> found in Cache!</div>
                         <div className="text-brand-warning pl-4">→ Block execution. Return cached result.</div>
                      </div>
                   </div>
                   
                   <div className="bg-brand-surface-2 p-6 rounded-xl border border-brand-border flex items-center justify-center">
                      <div className="text-center">
                         <ShieldCheck size={48} className="mx-auto text-purple-400 mb-4"/>
                         <h3 className="font-bold text-white">DUPLICATE CHARGES</h3>
                         <p className="text-4xl font-black text-brand-success mt-2">0</p>
                      </div>
                   </div>
                </div>
             </div>
          </motion.div>
        )}

        {/* ORDER TAB */}
        {activeTab === 'ORDER' && (
          <motion.div key="ord" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} className="space-y-8">
             <div className="dashboard-card p-10">
                <h2 className="text-lg font-bold text-white mb-8 border-b border-brand-border pb-4">Transactional Outbox Pattern (Event Broker)</h2>
                
                <div className="bg-brand-danger/10 border border-brand-danger p-6 rounded-xl mb-8">
                   <h3 className="font-bold text-brand-danger flex items-center gap-2 mb-2"><AlertTriangle size={18}/> Critical Scenario: Order Service Crashes</h3>
                   <p className="text-slate-300 text-sm">If Payment succeeds, but the Order Service is down, we MUST NOT lose the order. The system uses an Event Broker to decouple the transaction.</p>
                </div>
                
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 font-mono text-xs">
                   <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 text-center w-48">
                      <CreditCard className="mx-auto text-brand-success mb-2"/>
                      <p className="text-brand-success font-bold">Payment Succeeded</p>
                   </div>
                   
                   <ArrowRightIcon className="text-brand-primary" />
                   
                   <div className="bg-brand-primary/20 p-4 rounded-lg border border-brand-primary text-center w-48 shadow-[0_0_15px_rgba(14,165,233,0.3)]">
                      <Database className="mx-auto text-brand-primary mb-2"/>
                      <p className="text-brand-primary font-bold">Event Saved (Outbox)</p>
                   </div>
                   
                   <ArrowRightIcon className="text-slate-600" />
                   
                   <div className="bg-brand-danger/20 p-4 rounded-lg border border-brand-danger text-center w-48 opacity-50">
                      <XCircle className="mx-auto text-brand-danger mb-2"/>
                      <p className="text-brand-danger font-bold">Order Service (DOWN)</p>
                   </div>
                </div>
                
                <div className="mt-8 text-center text-slate-400 text-sm">
                   When the Order Service recovers, a worker processes the saved event and finalizes the Order. <strong className="text-white">Zero lost transactions.</strong>
                </div>
             </div>
          </motion.div>
        )}

        {/* RECOVERY TAB */}
        {activeTab === 'RECOVERY' && (
          <motion.div key="rec" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { title: 'Circuit Breaker', desc: 'If Payment Gateway fails continuously, trip the breaker to fast-fail and prevent cascading system collapse.', stat: 'Configured' },
                  { title: 'Dead Letter Queue (DLQ)', desc: 'Events that fail processing 5+ times are sent to a DLQ for manual engineer review.', stat: 'Active' },
                  { title: 'Reconciliation Cron', desc: 'Background sweep finds pending reservations older than 10 minutes and forcefully releases them.', stat: 'Running (Every 5m)' },
                  { title: 'Saga Compensation', desc: 'If an order fails permanently after payment, trigger automatic refund API to reverse the transaction.', stat: 'Configured' },
                ].map(r => (
                  <div key={r.title} className="dashboard-card p-6 border-slate-700">
                     <h3 className="font-bold text-white mb-2">{r.title}</h3>
                     <p className="text-sm text-slate-400 mb-4">{r.desc}</p>
                     <span className="text-[10px] font-bold text-brand-success uppercase tracking-widest bg-brand-success/10 px-2 py-1 rounded">{r.stat}</span>
                  </div>
                ))}
             </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

const ArrowRightIcon = ({className}: {className?: string}) => <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>;
