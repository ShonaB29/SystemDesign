import { useState } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, ArrowRight, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ScenarioStatus = 'idle' | 'running' | 'recovered' | 'failed';

export default function FailureSimulator() {
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [status, setStatus] = useState<ScenarioStatus>('idle');
  const [logs, setLogs] = useState<string[]>([]);

  const runScenario = (name: string, type: 'payment_fail' | 'order_fail' | 'duplicate') => {
    setActiveScenario(name);
    setStatus('running');
    setLogs([`> Starting Simulation: ${name}`]);
    
    setTimeout(() => {
      setLogs(l => [...l, "> Initializing transaction context..."]);
    }, 800);

    setTimeout(() => {
      if (type === 'payment_fail') {
         setLogs(l => [...l, "> ERROR: Payment Gateway returned 503 (Unavailable)"]);
      } else if (type === 'order_fail') {
         setLogs(l => [...l, "> Payment Authorized (200 OK)"]);
         setLogs(l => [...l, "> ERROR: Order Service Connection Refused"]);
      } else {
         setLogs(l => [...l, "> Duplicate POST /checkout detected!"]);
      }
    }, 2000);

    setTimeout(() => {
      if (type === 'payment_fail') {
         setLogs(l => [...l, "> Executing Compensation Transaction (Saga)"]);
         setLogs(l => [...l, "> Inventory released via Redis Lua script (+1)"]);
      } else if (type === 'order_fail') {
         setLogs(l => [...l, "> Triggering Transactional Outbox Pattern..."]);
         setLogs(l => [...l, "> Event 'PaymentSucceeded' durably saved to local DB."]);
      } else {
         setLogs(l => [...l, "> Idempotency Key 'uuid-992a' found in Redis cache."]);
         setLogs(l => [...l, "> Returning cached Reservation ID. Processing halted."]);
      }
    }, 3500);

    setTimeout(() => {
      if (type === 'payment_fail') {
         setLogs(l => [...l, "✓ RECOVERED: Stock is safely available for next customer. 0 Overselling."]);
         setStatus('recovered');
      } else if (type === 'order_fail') {
         setLogs(l => [...l, "> BullMQ retry worker executed. Order Service is back online."]);
         setLogs(l => [...l, "✓ RECOVERED: Order ST-2026-919 created. 0 Lost Payments."]);
         setStatus('recovered');
      } else {
         setLogs(l => [...l, "✓ RECOVERED: Single unit reserved. 0 Duplicate Charges."]);
         setStatus('recovered');
      }
    }, 5500);
  };

  const scenarios = [
    {
      title: "Payment Gateway Down",
      type: "payment_fail" as const,
      desc: "Simulates a scenario where the external payment provider crashes mid-transaction.",
      protection: "Saga Pattern (Compensation)",
      color: "border-critical-red",
      iconColor: "text-critical-red"
    },
    {
      title: "Order Service Crash",
      type: "order_fail" as const,
      desc: "Simulates a successful payment, but the internal Order Service crashes before creating the DB record.",
      protection: "Transactional Outbox Pattern",
      color: "border-warning-amber",
      iconColor: "text-warning-amber"
    },
    {
      title: "Duplicate Request (Double Click)",
      type: "duplicate" as const,
      desc: "Simulates a user clicking 'Buy' 5 times in 100 milliseconds.",
      protection: "Idempotency Keys",
      color: "border-purple-500",
      iconColor: "text-purple-500"
    }
  ];

  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-3">
          <ShieldAlert className="text-warning-amber" size={36} /> Failure Simulation Center
        </h1>
        <p className="text-gray-400 mt-2 text-lg">Test how SALESTORM behaves when dependencies fail.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
        {/* Scenarios */}
        <div className="space-y-4">
          {scenarios.map(s => (
            <div key={s.title} className={`glass-panel p-6 rounded-xl border ${activeScenario === s.title ? s.color : 'border-gray-800'} transition-all`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <AlertTriangle size={18} className={s.iconColor} /> {s.title}
                  </h3>
                  <p className="text-sm text-gray-400 mt-2">{s.desc}</p>
                  <div className="inline-flex items-center gap-1 mt-4 text-xs font-bold text-gray-500 bg-gray-900 px-2 py-1 rounded">
                    PROTECTION: <span className="text-electric-blue">{s.protection}</span>
                  </div>
                </div>
                <button 
                  onClick={() => runScenario(s.title, s.type)}
                  disabled={status === 'running'}
                  className="bg-gray-800 hover:bg-gray-700 text-white font-bold p-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Console / Output */}
        <div className="glass-panel p-6 rounded-2xl border border-gray-700 flex flex-col h-full min-h-[400px]">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center justify-between">
            System Telemetry Logs
            {status === 'running' && <div className="w-2 h-2 rounded-full bg-warning-amber animate-pulse"></div>}
            {status === 'recovered' && <CheckCircle2 size={16} className="text-success-green" />}
          </h2>
          
          <div className="flex-1 bg-[#0a0a0a] rounded-xl border border-gray-800 p-4 font-mono text-sm overflow-y-auto space-y-2">
            <AnimatePresence>
              {logs.length === 0 && (
                <p className="text-gray-600 italic">Waiting for simulation to begin...</p>
              )}
              {logs.map((log, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i} 
                  className={
                    log.includes('ERROR') ? 'text-critical-red' : 
                    log.includes('RECOVERED') ? 'text-success-green font-bold' : 
                    'text-gray-300'
                  }
                >
                  {log}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {status === 'recovered' && (
            <motion.button 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => { setLogs([]); setStatus('idle'); setActiveScenario(null); }}
              className="mt-4 w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} /> RESET SIMULATOR
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
