import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Cloud, Database, Network, Box, Key, Zap, FileText, Code2 } from 'lucide-react';

type Tab = 'HLD' | 'COMPONENTS' | 'SCHEMA' | 'API' | 'DEPLOYMENT' | 'ADR';

export default function Architecture() {
  const [activeTab, setActiveTab] = useState<Tab>('HLD');

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 pb-32">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
           <Server className="text-brand-primary" size={32} /> System Architecture
        </h1>
        <p className="text-slate-400">Scalable architecture for high-concurrency flash commerce.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-brand-border">
         {(['HLD', 'COMPONENTS', 'SCHEMA', 'API', 'DEPLOYMENT', 'ADR'] as Tab[]).map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-sm font-bold tracking-widest uppercase transition-colors relative ${activeTab === tab ? 'text-brand-primary' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {tab}
              {activeTab === tab && <motion.div layoutId="arch-tab" className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-primary shadow-[0_0_10px_rgba(14,165,233,0.5)]"></motion.div>}
            </button>
         ))}
      </div>

      <AnimatePresence mode="wait">
        {/* HLD TAB */}
        {activeTab === 'HLD' && (
          <motion.div key="hld" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} className="space-y-8">
             
             {/* Context Flow */}
             <div className="dashboard-card p-10 bg-brand-surface/50">
                <h2 className="text-lg font-bold text-white mb-8 flex items-center gap-2"><Network/> High Level Design (HLD)</h2>
                
                <div className="flex flex-col items-center gap-6 max-w-5xl mx-auto font-mono text-sm">
                   {/* Users */}
                   <div className="bg-slate-800 text-white px-8 py-3 rounded-full border border-slate-700 flex items-center gap-2 shadow-lg">
                      <UserIcon/> 10,000 CUSTOMERS
                   </div>
                   <div className="w-px h-8 bg-brand-primary"></div>
                   
                   {/* Edge */}
                   <div className="flex gap-2 items-center">
                      <div className="glass-node"><Cloud size={16}/> CDN / WAF</div>
                      <div className="text-slate-500">→</div>
                      <div className="glass-node"><Network size={16}/> Load Balancer</div>
                      <div className="text-slate-500">→</div>
                      <div className="glass-node border-brand-primary bg-brand-primary/10 text-brand-primary font-bold shadow-[0_0_20px_rgba(14,165,233,0.2)]">API GATEWAY</div>
                   </div>
                   <div className="w-px h-8 bg-brand-primary"></div>
                   
                   {/* Admission Layer */}
                   <div className="flex gap-4 items-center">
                      <div className="glass-node border-brand-warning bg-brand-warning/10 text-brand-warning shadow-[0_0_15px_rgba(245,158,11,0.2)]">Flash Sale Admission + Redis Cache</div>
                      <div className="text-slate-500">→</div>
                      <div className="glass-node border-brand-success bg-brand-success/10 text-brand-success shadow-[0_0_15px_rgba(16,185,129,0.2)]">Reservation Service</div>
                   </div>
                   <div className="w-px h-8 bg-brand-primary"></div>
                   
                   {/* Data / Critical Boundary */}
                   <div className="flex flex-col items-center bg-brand-surface-2 p-6 rounded-2xl border border-brand-success w-full max-w-sm relative shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-success text-brand-bg px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                         Authoritative Source of Truth
                      </div>
                      <div className="glass-node border-brand-success mt-4 bg-brand-success/10 text-white w-full"><Database size={16}/> Inventory DB</div>
                   </div>
                   <div className="w-px h-8 bg-brand-primary"></div>

                   {/* Payment Layer */}
                   <div className="flex gap-4 items-center">
                      <div className="glass-node border-brand-primary text-brand-primary bg-brand-primary/10">Payment Service</div>
                      <div className="text-slate-500">→</div>
                      <div className="glass-node bg-slate-800 border-slate-700 text-slate-300">Payment Gateway</div>
                   </div>
                   <div className="w-px h-8 bg-brand-primary"></div>

                   {/* Async Layer */}
                   <div className="glass-node border-purple-500 bg-purple-500/10 text-purple-400">Message Queue</div>
                   <div className="w-px h-8 bg-brand-primary"></div>

                   <div className="glass-node border-brand-primary text-brand-primary bg-brand-primary/10 mb-4"><Box size={16}/> Order Service</div>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div className="glass-node"><Zap size={16}/> Shipping</div>
                      <div className="glass-node"><FileText size={16}/> Notification</div>
                   </div>
                </div>
             </div>

             {/* Service Boundaries */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { name: 'Inventory Service', resp: 'Own inventory availability and reservation consistency.', data: 'Quantity, Reservation state, Version', scale: 'Horizontal API scaling + controlled contention.', fail: 'Timeout, retry, idempotency.' },
                  { name: 'Payment Service', resp: 'Process financial transactions idempotently.', data: 'Payment Status, Idempotency Keys', scale: 'Horizontal scaling.', fail: 'Circuit breaker to external gateway.' },
                  { name: 'Order Service', resp: 'Maintain the Order State Machine.', data: 'Order Lifecycle, Customer Fulfillment', scale: 'Consumer scaling via Message Broker.', fail: 'Transactional Outbox Pattern.' },
                ].map(s => (
                  <div key={s.name} className="dashboard-card p-6">
                     <h3 className="text-lg font-bold text-white mb-4 border-b border-brand-border pb-4">{s.name}</h3>
                     <div className="space-y-4 text-xs font-mono">
                        <div><span className="text-slate-500 block mb-1">Responsibility</span><span className="text-slate-300">{s.resp}</span></div>
                        <div><span className="text-slate-500 block mb-1">Data Owned</span><span className="text-brand-primary">{s.data}</span></div>
                        <div><span className="text-slate-500 block mb-1">Scaling</span><span className="text-brand-success">{s.scale}</span></div>
                        <div><span className="text-slate-500 block mb-1">Failure Strategy</span><span className="text-brand-warning">{s.fail}</span></div>
                     </div>
                  </div>
                ))}
             </div>
          </motion.div>
        )}

        {/* COMPONENTS TAB (Member 2 LLD) */}
        {activeTab === 'COMPONENTS' && (
          <motion.div key="comp" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} className="space-y-8">
             <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Inventory LLD */}
                <div className="dashboard-card p-6">
                   <h2 className="text-lg font-bold text-white mb-6 border-b border-brand-border pb-4 flex items-center gap-2"><Database size={18}/> Inventory / Reservation LLD</h2>
                   <div className="space-y-2 font-mono text-xs text-slate-300 mb-6">
                      <div className="bg-slate-800 p-2 rounded">ReservationController</div>
                      <div className="flex justify-center text-slate-500">↓ (idempotency key)</div>
                      <div className="bg-slate-800 p-2 rounded">ReservationService</div>
                      <div className="flex justify-center text-slate-500">↓</div>
                      <div className="grid grid-cols-2 gap-2">
                         <div className="bg-brand-success/20 border border-brand-success/50 text-brand-success p-2 rounded text-center">InventoryRepository</div>
                         <div className="bg-slate-800 p-2 rounded text-center">ReservationRepository</div>
                      </div>
                   </div>
                   <div className="bg-brand-bg border border-brand-border p-4 rounded-lg text-[10px] font-mono text-brand-primary">
                      InventoryRepository manages the atomic inventory update.
                   </div>
                </div>

                {/* Payment LLD */}
                <div className="dashboard-card p-6">
                   <h2 className="text-lg font-bold text-white mb-6 border-b border-brand-border pb-4 flex items-center gap-2"><Zap size={18}/> Payment LLD</h2>
                   <div className="space-y-2 font-mono text-xs text-slate-300 mb-6">
                      <div className="bg-slate-800 p-2 rounded">PaymentController</div>
                      <div className="flex justify-center text-slate-500">↓ (idempotency key)</div>
                      <div className="bg-slate-800 p-2 rounded">PaymentService</div>
                      <div className="flex justify-center text-slate-500">↓</div>
                      <div className="grid grid-cols-3 gap-2">
                         <div className="bg-slate-800 p-2 rounded text-center text-[10px]">Payment<br/>Repository</div>
                         <div className="bg-slate-800 p-2 rounded text-center text-[10px]">Payment<br/>Gateway</div>
                         <div className="bg-brand-primary/20 border border-brand-primary/50 text-brand-primary p-2 rounded text-center text-[10px]">Order<br/>Service</div>
                      </div>
                   </div>
                   <p className="text-xs text-slate-400 mt-4">Demonstrates integration via PaymentGateway and async delivery to OrderService.</p>
                </div>

                {/* Order LLD */}
                <div className="dashboard-card p-6">
                   <h2 className="text-lg font-bold text-white mb-6 border-b border-brand-border pb-4 flex items-center gap-2"><Box size={18}/> Order LLD</h2>
                   <div className="space-y-2 font-mono text-xs text-slate-300 mb-6">
                      <div className="bg-slate-800 p-2 rounded">OrderService</div>
                      <div className="flex justify-center text-slate-500">↓</div>
                      <div className="bg-slate-800 p-2 rounded">OrderRepository</div>
                      <div className="flex justify-center text-slate-500">↓</div>
                      <div className="bg-brand-warning/20 border border-brand-warning/50 text-brand-warning p-2 rounded text-center">Order (Entity)</div>
                   </div>
                   <p className="text-xs text-slate-400 mt-4">Demonstrates core domain logic encapsulated in Order entity.</p>
                </div>

             </div>
          </motion.div>
        )}

        {/* SCHEMA TAB (Database per Service) */}
        {activeTab === 'SCHEMA' && (
          <motion.div key="schema" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} className="space-y-8">
             <div className="dashboard-card p-10">
                <h2 className="text-lg font-bold text-white mb-6 border-b border-brand-border pb-4 flex items-center gap-2"><Database size={20}/> Database Schema (Per Service, PostgreSQL)</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   {/* Product Service */}
                   <div className="bg-brand-bg border border-brand-border rounded-xl p-4">
                      <h3 className="font-bold text-brand-primary mb-3">Product Service DB</h3>
                      <div className="space-y-2 font-mono text-xs">
                         <div className="bg-slate-900 border border-slate-700 p-2 rounded">
                            <span className="font-bold text-slate-300 block mb-1">product</span>
                            <div className="text-slate-500 pl-2">product_id (PK)<br/>category_id (FK)<br/>name<br/>base_price<br/>is_active</div>
                         </div>
                         <div className="bg-slate-900 border border-slate-700 p-2 rounded">
                            <span className="font-bold text-slate-300 block mb-1">category</span>
                            <div className="text-slate-500 pl-2">category_id (PK)<br/>parent_category_id</div>
                         </div>
                      </div>
                   </div>

                   {/* Sale Service */}
                   <div className="bg-brand-bg border border-brand-border rounded-xl p-4">
                      <h3 className="font-bold text-brand-primary mb-3">Sale Service DB</h3>
                      <div className="space-y-2 font-mono text-xs">
                         <div className="bg-slate-900 border border-slate-700 p-2 rounded">
                            <span className="font-bold text-slate-300 block mb-1">sale</span>
                            <div className="text-slate-500 pl-2">sale_id (PK)<br/>starts_at<br/>ends_at</div>
                         </div>
                         <div className="bg-slate-900 border border-slate-700 p-2 rounded">
                            <span className="font-bold text-slate-300 block mb-1">sale_product</span>
                            <div className="text-slate-500 pl-2">sale_id (PK)<br/>product_id (PK)<br/>flash_price<br/>sale_limit</div>
                         </div>
                      </div>
                   </div>

                   {/* Inventory / Reservation Service (Critical Boundary) */}
                   <div className="bg-brand-success/10 border border-brand-success rounded-xl p-4 relative shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                      <div className="absolute top-2 right-2 text-[10px] font-black text-brand-success tracking-widest uppercase bg-brand-success/20 px-2 py-1 rounded">Consistency Boundary</div>
                      <h3 className="font-bold text-brand-success mb-3">Inventory Service DB</h3>
                      <div className="space-y-2 font-mono text-xs">
                         <div className="bg-slate-900 border border-brand-success/50 p-2 rounded">
                            <span className="font-bold text-white block mb-1">inventory</span>
                            <div className="text-slate-300 pl-2">inventory_id (PK)<br/>product_id (UQ)<br/>total_stock<br/>available_quantity<br/>reserved_quantity<br/>sold_quantity<br/>version</div>
                         </div>
                         <div className="bg-slate-900 border border-slate-700 p-2 rounded">
                            <span className="font-bold text-slate-300 block mb-1">inventory_reservation</span>
                            <div className="text-slate-500 pl-2">reservation_id (uuid PK)<br/>inventory_id (FK)<br/>customer_id<br/>quantity<br/>status<br/>idempotency_key (UQ)</div>
                         </div>
                      </div>
                   </div>

                   {/* Payment Service */}
                   <div className="bg-brand-bg border border-brand-border rounded-xl p-4">
                      <h3 className="font-bold text-brand-warning mb-3">Payment Service DB</h3>
                      <div className="space-y-2 font-mono text-xs">
                         <div className="bg-slate-900 border border-slate-700 p-2 rounded">
                            <span className="font-bold text-slate-300 block mb-1">payment</span>
                            <div className="text-slate-500 pl-2">payment_id (PK)<br/>order_id<br/>amount<br/>status<br/>transaction_ref (UQ)<br/>idempotency_key (UQ)</div>
                         </div>
                      </div>
                   </div>

                   {/* Order Service */}
                   <div className="bg-brand-bg border border-brand-border rounded-xl p-4">
                      <h3 className="font-bold text-purple-400 mb-3">Order Service DB</h3>
                      <div className="space-y-2 font-mono text-xs">
                         <div className="bg-slate-900 border border-slate-700 p-2 rounded">
                            <span className="font-bold text-slate-300 block mb-1">orders</span>
                            <div className="text-slate-500 pl-2">order_id (PK)<br/>customer_id<br/>reservation_id (UQ)<br/>total_amount<br/>idempotency_key (UQ)</div>
                         </div>
                         <div className="bg-slate-900 border border-slate-700 p-2 rounded">
                            <span className="font-bold text-slate-300 block mb-1">order_item</span>
                            <div className="text-slate-500 pl-2">order_item_id (PK)<br/>order_id (FK)<br/>product_id<br/>quantity</div>
                         </div>
                      </div>
                   </div>

                   {/* Base Template (Events) */}
                   <div className="bg-brand-bg border border-slate-700 border-dashed rounded-xl p-4 opacity-80">
                      <h3 className="font-bold text-slate-400 mb-3">Template (In EVERY Service DB)</h3>
                      <div className="space-y-2 font-mono text-xs">
                         <div className="bg-slate-900 border border-slate-700 p-2 rounded">
                            <span className="font-bold text-slate-400 block mb-1">outbox_event</span>
                            <div className="text-slate-500 pl-2">event_id (PK)<br/>aggregate_type<br/>payload (jsonb)<br/>published (boolean)</div>
                         </div>
                         <div className="bg-slate-900 border border-slate-700 p-2 rounded">
                            <span className="font-bold text-slate-400 block mb-1">processed_event</span>
                            <div className="text-slate-500 pl-2">event_id (PK)<br/>consumer</div>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="mt-8 bg-slate-900 p-4 rounded-xl border border-slate-700 text-sm text-slate-400">
                   <h4 className="font-bold text-white mb-2 flex items-center gap-2"><Key size={16}/> Schema Design Notes</h4>
                   <ul className="list-disc pl-5 space-y-1">
                      <li>Each service owns its own PostgreSQL database; no service reads another service's tables (Database-per-service pattern).</li>
                      <li>Cross-service links are stored as logical IDs only (no foreign keys). Consistency is maintained via Outbox pattern and Idempotent consumers.</li>
                      <li><strong>Idempotency Guarantees:</strong> UNIQUE(customer_id, idempotency_key) on reservations; UNIQUE(idempotency_key) on orders and payments.</li>
                      <li>The Inventory + Reservation tables form the absolute consistency boundary of the platform.</li>
                   </ul>
                </div>
             </div>
          </motion.div>
        )}

        {/* API TAB */}
        {activeTab === 'API' && (
          <motion.div key="api" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}>
             <div className="dashboard-card p-8">
                <h2 className="text-lg font-bold text-white mb-8 border-b border-brand-border pb-4"><Code2 className="inline mr-2"/> API Explorer</h2>
                <div className="space-y-4 font-mono text-sm">
                   {[
                     { method: 'POST', path: '/reservations', desc: 'Creates an atomic inventory reservation.', header: 'Idempotency-Key' },
                     { method: 'POST', path: '/checkout', desc: 'Locks cart and initiates payment flow.', header: 'Authorization' },
                     { method: 'POST', path: '/payments', desc: 'Processes charge via external gateway.', header: 'Idempotency-Key' },
                     { method: 'POST', path: '/orders', desc: 'Fulfills order after payment success.', header: 'Trace-ID' },
                     { method: 'POST', path: '/reservations/:id/release', desc: 'Releases reservation if payment times out.', header: 'System-Token' },
                   ].map(a => (
                     <div key={a.path} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-brand-bg rounded-lg border border-brand-border gap-4">
                        <div className="flex items-center gap-4">
                           <span className={`px-2 py-1 rounded text-[10px] font-black tracking-widest ${a.method === 'POST' ? 'bg-brand-primary/20 text-brand-primary' : 'bg-brand-success/20 text-brand-success'}`}>{a.method}</span>
                           <span className="text-white">{a.path}</span>
                        </div>
                        <div className="text-slate-500 text-xs hidden lg:block">{a.desc}</div>
                        <div className="text-brand-warning text-xs border border-brand-warning/30 bg-brand-warning/10 px-2 py-1 rounded">{a.header}</div>
                     </div>
                   ))}
                </div>
             </div>
          </motion.div>
        )}

        {/* ADR TAB */}
        {activeTab === 'ADR' && (
          <motion.div key="adr" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {[
               { id: 'ADR-001', title: 'Atomic Inventory Reservation', dec: 'Use Redis Lua Script for atomic reservation at the inventory boundary.', why: 'Prevents overselling under 10,000 req/s concurrency.', trd: 'Higher coordination cost between Cache and DB.' },
               { id: 'ADR-002', title: 'Async Order Processing', dec: 'Keep purchase boundary sync, but use async events (BullMQ) for downstream.', why: 'Reduces coupling and isolates Order Service crashes from Payment successes.', trd: 'Eventual consistency for downstream state.' },
               { id: 'ADR-003', title: 'SQL for Transactional Data', dec: 'Use PostgreSQL for Orders and final Inventory truth.', why: 'Strong transactional (ACID) guarantees.', trd: 'Requires pooling and careful scaling.' },
               { id: 'ADR-004', title: 'Idempotency Key Strategy', dec: 'Require Idempotency-Key headers on all mutating POST requests.', why: 'Prevents duplicate reservations and double-charging customers.', trd: 'Requires distributed Redis cache for key storage.' },
             ].map(adr => (
               <div key={adr.id} className="dashboard-card p-6 border-brand-primary/30 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary"></div>
                  <h3 className="text-sm font-mono text-brand-primary mb-2">{adr.id}</h3>
                  <p className="font-bold text-lg text-white mb-6">{adr.title}</p>
                  
                  <div className="space-y-4 text-xs font-mono">
                     <div><span className="text-slate-500 block mb-1">DECISION</span><span className="text-brand-success">{adr.dec}</span></div>
                     <div><span className="text-slate-500 block mb-1">WHY</span><span className="text-slate-300">{adr.why}</span></div>
                     <div className="bg-brand-bg p-3 border border-brand-border rounded"><span className="text-slate-500 block mb-1">TRADE-OFF</span><span className="text-brand-warning">{adr.trd}</span></div>
                  </div>
               </div>
             ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Utility components for diagram
const UserIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
