import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, CreditCard, Box, CheckCircle2, AlertTriangle, ShieldCheck, Clock, RefreshCw, Package, Truck } from 'lucide-react';
import { inventoryApi, reservationApi, paymentApi, orderApi } from '../api';

type Step = 1 | 2 | 3 | 4;
type PaymentStatus = 'idle' | 'processing' | 'success' | 'failure' | 'timeout' | 'duplicate';

interface Inventory {
  productId: string;
  total: number;
  available: number;
  reserved: number;
  sold: number;
  isConsistent: boolean;
}

interface Reservation {
  id: string;
  status: string;
  expiresAt: string;
  idempotencyKey: string;
}

interface Order {
  id: string;
  status: string;
  totalAmount: string | number;
  paymentId?: string;
}

const PRODUCT_ID = import.meta.env.VITE_PRODUCT_ID || '';
const CUSTOMER_ID = import.meta.env.VITE_CUSTOMER_ID || 'demo-customer';

export default function FlashSale() {
  const [step, setStep] = useState<Step>(1);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');

  // Data state
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState<string | null>(null);

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [reservationLoading, setReservationLoading] = useState(false);
  const [reservationError, setReservationError] = useState<string | null>(null);

  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentKey] = useState(`PAY-${Date.now()}-${Math.random().toString(36).substring(7)}`);

  const [order, setOrder] = useState<Order | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Countdown state
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load inventory on mount and after transactions
  const loadInventory = useCallback(async () => {
    setInventoryLoading(true);
    setInventoryError(null);
    try {
      const data = await inventoryApi.getAvailability(PRODUCT_ID);
      setInventory(data);
    } catch (e: any) {
      setInventoryError('Failed to load inventory.');
    } finally {
      setInventoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  // Real countdown from backend expiresAt
  useEffect(() => {
    if (reservation?.expiresAt && step === 2) {
      if (countdownRef.current) clearInterval(countdownRef.current);
      const tick = () => {
        const secs = Math.max(0, Math.floor((new Date(reservation.expiresAt).getTime() - Date.now()) / 1000));
        setSecondsLeft(secs);
        if (secs === 0) {
          clearInterval(countdownRef.current!);
          setReservationError('Reservation expired. Inventory released.');
        }
      };
      tick();
      countdownRef.current = setInterval(tick, 1000);
      return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
    }
  }, [reservation, step]);

  const formatCountdown = (secs: number) => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  // BUY NOW — real reservation
  const handleBuyNow = async () => {
    if (!inventory || inventory.available === 0) return;
    setReservationLoading(true);
    setReservationError(null);
    try {
      const idempotencyKey = `RSV-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const data = await reservationApi.createAtomicReservation(PRODUCT_ID, CUSTOMER_ID);
      setReservation({ ...data, idempotencyKey: data.idempotencyKey || idempotencyKey });
      await loadInventory(); // Refresh stock display
      setStep(2);
    } catch (e: any) {
      if (e.message === 'INSUFFICIENT_INVENTORY' || e.message?.includes('sold out')) {
        setReservationError('SOLD OUT — No inventory available.');
      } else {
        setReservationError(e.message || 'Reservation failed. Please try again.');
      }
    } finally {
      setReservationLoading(false);
    }
  };

  // PAYMENT — real API call
  const handlePayment = async (scenario: 'success' | 'failure' | 'timeout' | 'duplicate') => {
    if (!reservation) return;
    setPaymentStatus('processing');
    try {
      // For duplicate test, we re-use the same paymentKey
      const keyToUse = scenario === 'duplicate' ? paymentKey : `${paymentKey}-${scenario.toUpperCase()}`;
      const data = await paymentApi.processCharge(reservation.id, 99999, keyToUse);
      setPaymentId(data.id || data.transactionId);

      if (data.status === 'SUCCESS') {
        setPaymentStatus('success');
        // Poll for order creation (async via message queue)
        await pollForOrder(data.id || data.transactionId);
      } else if (data.status === 'FAILED') {
        setPaymentStatus('failure');
        await loadInventory(); // Show restored inventory
      } else {
        setPaymentStatus('timeout');
      }
    } catch (e: any) {
      setPaymentStatus('failure');
      await loadInventory();
    }
  };

  const handleDuplicate = async () => {
    if (!reservation) return;
    setPaymentStatus('processing');
    try {
      // First call
      const first = await paymentApi.processCharge(reservation.id, 99999, paymentKey);
      // Second call with SAME key — must return same result
      const second = await paymentApi.processCharge(reservation.id, 99999, paymentKey);
      const isDuplicate = first.id === second.id || first.transactionId === second.transactionId;
      setPaymentId(first.id || first.transactionId);
      setPaymentStatus(isDuplicate ? 'duplicate' : 'success');
      if (first.status === 'SUCCESS') {
        await pollForOrder(first.id || first.transactionId);
      }
    } catch (e: any) {
      setPaymentStatus('failure');
    }
  };

  // Poll for order after payment
  const pollForOrder = async (pId: string) => {
    setOrderLoading(true);
    setOrderError(null);
    let attempts = 0;
    const maxAttempts = 8;
    const poll = async (): Promise<void> => {
      attempts++;
      try {
        const orderData = await orderApi.getOrderByPaymentId(pId);
        if (orderData && orderData.id) {
          setOrder(orderData);
          setStep(4);
          return;
        }
      } catch {}
      // If no order yet and payment was success, create it
      if (attempts === 1) {
        try {
          const created = await orderApi.createOrder(pId);
          setOrder(created);
          setStep(4);
          setOrderLoading(false);
          return;
        } catch {}
      }
      if (attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 800));
        return poll();
      } else {
        setOrderError('Order confirmation is taking longer than expected.');
        setOrderLoading(false);
      }
    };
    await poll();
    setOrderLoading(false);
    await loadInventory();
  };

  const resetFlow = () => {
    setStep(1);
    setPaymentStatus('idle');
    setReservation(null);
    setReservationError(null);
    setOrder(null);
    setPaymentId(null);
    loadInventory();
  };

  const soldPct = inventory ? Math.round((inventory.sold / inventory.total) * 100) : 76;
  const reservedPct = inventory ? Math.round((inventory.reserved / inventory.total) * 100) : 18;
  const availPct = inventory ? Math.round((inventory.available / inventory.total) * 100) : 6;

  const orderStatuses = ['CREATED', 'PAYMENT_PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  const currentStatusIdx = order ? orderStatuses.indexOf(order.status) : 2;

  return (
    <div className="max-w-[1200px] mx-auto p-8 pb-32">
      {/* Stepper */}
      <div className="flex items-center justify-between mb-12 bg-brand-surface border border-brand-border p-4 rounded-xl shadow-lg">
        {[
          { num: 1, label: 'PRODUCT', icon: <ShoppingBag size={18}/> },
          { num: 2, label: 'CHECKOUT', icon: <Box size={18}/> },
          { num: 3, label: 'PAYMENT', icon: <CreditCard size={18}/> },
          { num: 4, label: 'ORDER', icon: <CheckCircle2 size={18}/> },
        ].map((s, i) => (
          <div key={s.num} className="flex items-center gap-4 flex-1">
            <div className={`flex items-center gap-3 ${step >= s.num ? 'text-brand-primary' : 'text-slate-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold text-sm ${step === s.num ? 'border-brand-primary bg-brand-primary/10' : step > s.num ? 'border-brand-primary bg-brand-primary text-brand-bg' : 'border-slate-700'}`}>
                {step > s.num ? <CheckCircle2 size={16}/> : `0${s.num}`}
              </div>
              <span className="font-bold tracking-widest text-xs uppercase hidden md:flex items-center gap-2">
                {s.icon} {s.label}
              </span>
            </div>
            {i < 3 && <div className={`h-px flex-1 mx-4 ${step > s.num ? 'bg-brand-primary' : 'bg-slate-800'}`}></div>}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 1: PRODUCT */}
        {step === 1 && (
          <motion.div key="1" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, x:-20}} className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-brand-bg border border-brand-border rounded-2xl aspect-square flex items-center justify-center p-12 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/10 to-transparent"></div>
              <img src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80" alt="MacBook" className="rounded-xl shadow-2xl z-10" />
              <div className="absolute top-4 left-4 bg-brand-danger text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-[0_0_10px_rgba(239,68,68,0.5)]">Live Flash Sale</div>
            </div>

            <div className="flex flex-col justify-center">
              <h1 className="text-4xl font-black mb-2">MacBook Air M4</h1>
              <p className="text-slate-400 mb-8">Space Black. 16GB Unified Memory. 512GB SSD.</p>

              <div className="flex items-end gap-4 mb-8">
                <span className="text-4xl font-black text-white">₹99,999</span>
                <span className="text-xl text-slate-500 line-through mb-1">₹1,04,999</span>
                <span className="text-brand-success font-bold mb-1">₹5,000 OFF</span>
              </div>

              {/* LIVE INVENTORY from backend */}
              <div className="bg-brand-surface p-6 rounded-xl border border-brand-border mb-8">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Live Inventory</p>
                    {inventoryLoading ? (
                      <p className="text-2xl font-black text-slate-400 animate-pulse">Loading...</p>
                    ) : inventoryError ? (
                      <p className="text-lg text-brand-danger">{inventoryError}</p>
                    ) : (
                      <p className="text-2xl font-black text-brand-primary">
                        {inventory?.available} / {inventory?.total} UNITS
                      </p>
                    )}
                  </div>
                  <div className="text-right font-mono text-xs text-slate-500">
                    <p>Sold: {inventory?.sold ?? '—'}</p>
                    <p>Reserved: {inventory?.reserved ?? '—'}</p>
                  </div>
                </div>
                <div className="h-2 bg-brand-bg rounded-full overflow-hidden flex">
                  <div className="bg-brand-primary h-full transition-all" style={{width: `${soldPct}%`}}></div>
                  <div className="bg-brand-warning h-full transition-all" style={{width: `${reservedPct}%`}}></div>
                  <div className="bg-brand-success h-full transition-all" style={{width: `${availPct}%`}}></div>
                </div>
                <div className="flex justify-between text-[10px] font-bold mt-2">
                  <span className="text-brand-primary">SOLD: {inventory?.sold}</span>
                  <span className="text-brand-warning">RESERVED: {inventory?.reserved}</span>
                  <span className="text-brand-success">AVAILABLE: {inventory?.available}</span>
                </div>
              </div>

              {reservationError && (
                <div className="mb-4 p-3 rounded-lg border border-brand-danger/50 bg-brand-danger/10 text-brand-danger text-sm font-mono">
                  {reservationError}
                </div>
              )}

              <button
                onClick={handleBuyNow}
                disabled={reservationLoading || inventoryLoading || (inventory?.available === 0)}
                className="primary-btn py-4 text-lg w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {reservationLoading ? (
                  <><RefreshCw size={20} className="animate-spin"/> Securing Your Item...</>
                ) : inventory?.available === 0 ? (
                  'SOLD OUT'
                ) : (
                  'BUY NOW'
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: CHECKOUT */}
        {step === 2 && (
          <motion.div key="2" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Reservation Timer */}
              {reservation && (
                <div className={`dashboard-card p-8 ${secondsLeft > 0 ? 'border-brand-success/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]' : 'border-brand-danger/30'}`}>
                  <h2 className={`text-xl font-bold flex items-center gap-2 mb-2 ${secondsLeft > 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
                    <ShieldCheck/> {secondsLeft > 0 ? 'INVENTORY RESERVED' : 'RESERVATION EXPIRED'}
                  </h2>
                  <p className="text-slate-400 text-sm font-mono mb-1">RES-ID: {reservation.id}</p>
                  <p className="text-slate-400">Your unit is locked. Complete checkout within the reservation window.</p>
                  <div className="mt-4 flex items-center gap-3 font-mono text-2xl text-white">
                    <Clock className={secondsLeft > 60 ? 'text-brand-warning' : 'text-brand-danger'}/>
                    <span className={`${secondsLeft > 0 ? 'animate-pulse' : ''} ${secondsLeft > 60 ? 'text-brand-warning' : 'text-brand-danger'}`}>
                      {formatCountdown(secondsLeft)}
                    </span>
                    <span className="text-slate-400">remaining</span>
                  </div>
                </div>
              )}

              <div className="dashboard-card p-8">
                <h2 className="text-lg font-bold mb-6">Customer & Delivery</h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <input disabled value="Demo Customer" className="bg-brand-bg border border-brand-border rounded p-3 text-slate-300" />
                  <input disabled value="demo@salestorm.io" className="bg-brand-bg border border-brand-border rounded p-3 text-slate-300" />
                </div>
                <textarea disabled value="123 Tech Park, Floor 4, Bangalore, 560001" className="bg-brand-bg border border-brand-border rounded p-3 text-slate-300 w-full" rows={3}></textarea>
              </div>
            </div>

            <div className="dashboard-card p-8 h-fit">
              <h2 className="text-lg font-bold mb-6">Order Summary</h2>
              <div className="flex justify-between text-sm mb-4">
                <span className="text-slate-400">MacBook Air M4</span>
                <span className="text-white">₹99,999</span>
              </div>
              <div className="flex justify-between text-sm mb-4 pb-4 border-b border-slate-800">
                <span className="text-slate-400">Shipping</span>
                <span className="text-brand-success">FREE</span>
              </div>
              {reservation && (
                <div className="text-xs font-mono text-slate-500 mb-4 pb-4 border-b border-slate-800">
                  <p>Reservation: {reservation.id.slice(0, 8)}...</p>
                  <p>Status: {reservation.status}</p>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold mb-8">
                <span>Total</span>
                <span className="text-brand-primary">₹99,999</span>
              </div>
              <button
                onClick={() => setStep(3)}
                disabled={secondsLeft === 0}
                className="primary-btn w-full py-4 flex justify-between px-6 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                PAY SECURELY <span className="font-normal opacity-80">₹99,999</span>
              </button>
              {secondsLeft === 0 && (
                <p className="text-center text-brand-danger text-xs mt-3">Reservation expired. Please start over.</p>
              )}
            </div>
          </motion.div>
        )}

        {/* STEP 3: PAYMENT */}
        {step === 3 && (
          <motion.div key="3" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} className="max-w-2xl mx-auto dashboard-card p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-bg border border-brand-border flex items-center justify-center mx-auto mb-6 shadow-lg">
              <CreditCard size={32} className="text-brand-primary"/>
            </div>
            <h2 className="text-2xl font-bold mb-2">SECURE PAYMENT GATEWAY</h2>
            <p className="text-slate-400 mb-8">Choose a scenario to test system resilience. All calls hit the real backend.</p>

            <div className="bg-brand-bg p-4 rounded-lg font-mono text-xs text-left space-y-2 mb-10 border border-brand-border text-slate-300">
              <div className="flex justify-between"><span>Amount:</span> <span className="text-white font-bold">₹99,999</span></div>
              <div className="flex justify-between"><span>Reservation:</span> <span className="text-brand-primary">{reservation?.id?.slice(0,12)}...</span></div>
              <div className="flex justify-between"><span>Idempotency-Key:</span> <span className="text-brand-warning">{paymentKey.slice(0, 20)}...</span></div>
            </div>

            {paymentStatus === 'idle' && (
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => handlePayment('success')} className="bg-brand-surface-2 hover:bg-brand-success/20 border border-brand-success/50 text-brand-success font-bold py-3 rounded-lg transition-colors">SUCCESS</button>
                <button onClick={() => handlePayment('failure')} className="bg-brand-surface-2 hover:bg-brand-danger/20 border border-brand-danger/50 text-brand-danger font-bold py-3 rounded-lg transition-colors">FAILURE</button>
                <button onClick={() => handlePayment('timeout')} className="bg-brand-surface-2 hover:bg-brand-warning/20 border border-brand-warning/50 text-brand-warning font-bold py-3 rounded-lg transition-colors">TIMEOUT</button>
                <button onClick={handleDuplicate} className="bg-brand-surface-2 hover:bg-purple-500/20 border border-purple-500/50 text-purple-400 font-bold py-3 rounded-lg transition-colors">DUPLICATE</button>
              </div>
            )}

            {paymentStatus === 'processing' && (
              <div className="py-8 flex flex-col items-center">
                <RefreshCw className="animate-spin text-brand-primary mb-4" size={32}/>
                <p className="font-bold text-white tracking-widest uppercase">Processing Payment...</p>
                <p className="text-slate-400 text-xs mt-2 font-mono">Calling POST /api/payments → Mock Gateway</p>
              </div>
            )}

            {(paymentStatus === 'success' || orderLoading) && (
              <div className="py-8 text-brand-success">
                <CheckCircle2 size={48} className="mx-auto mb-4"/>
                <p className="font-bold tracking-widest uppercase">Payment Authorized</p>
                <p className="text-xs text-slate-400 font-mono mt-1">TXN-ID: {paymentId}</p>
                {orderLoading && <p className="text-brand-warning text-xs mt-3 animate-pulse">⚡ Order Service creating order...</p>}
                {orderError && <p className="text-brand-danger text-xs mt-3">{orderError}</p>}
              </div>
            )}

            {paymentStatus === 'failure' && (
              <div className="py-8 text-left border border-brand-danger/30 bg-brand-danger/5 p-6 rounded-xl">
                <div className="flex items-center gap-3 text-brand-danger font-bold text-lg mb-6">
                  <AlertTriangle/> PAYMENT FAILED
                </div>
                <div className="space-y-3 font-mono text-sm text-slate-300">
                  <p className="flex items-center gap-2"><AlertTriangle size={16} className="text-brand-danger"/> Payment Failed — Not charged</p>
                  <p className="flex items-center gap-2"><CheckCircle2 size={16} className="text-brand-warning"/> Reservation Released → Inventory Restored</p>
                  <p className="flex items-center gap-2"><CheckCircle2 size={16} className="text-brand-success"/> Available Inventory: {inventory?.available}</p>
                </div>
                <button onClick={resetFlow} className="mt-8 secondary-btn w-full">START OVER</button>
              </div>
            )}

            {paymentStatus === 'timeout' && (
              <div className="py-8 text-left border border-brand-warning/30 bg-brand-warning/5 p-6 rounded-xl">
                <div className="flex items-center gap-3 text-brand-warning font-bold text-lg mb-6">
                  <Clock/> PAYMENT TIMEOUT
                </div>
                <div className="space-y-3 font-mono text-sm text-slate-300">
                  <p className="flex items-center gap-2"><Clock size={16} className="text-brand-warning"/> Payment timed out in gateway</p>
                  <p className="flex items-center gap-2"><CheckCircle2 size={16} className="text-brand-primary"/> Reconciliation in progress</p>
                  <p className="flex items-center gap-2"><CheckCircle2 size={16} className="text-brand-success"/> No duplicate charge created</p>
                </div>
                <button onClick={resetFlow} className="mt-8 secondary-btn w-full">START OVER</button>
              </div>
            )}

            {paymentStatus === 'duplicate' && (
              <div className="py-8 text-left border border-purple-500/30 bg-purple-500/5 p-6 rounded-xl">
                <div className="flex items-center gap-3 text-purple-400 font-bold text-lg mb-6">
                  <ShieldCheck/> DUPLICATE BLOCKED
                </div>
                <div className="space-y-3 font-mono text-sm text-slate-300">
                  <p className="flex items-center gap-2"><CheckCircle2 size={16} className="text-purple-400"/> Same Idempotency-Key sent twice</p>
                  <p className="flex items-center gap-2"><CheckCircle2 size={16} className="text-brand-primary"/> Existing payment returned — no new charge</p>
                  <p className="flex items-center gap-2"><CheckCircle2 size={16} className="text-brand-success"/> 1 Payment, 1 Order guaranteed</p>
                </div>
                {order && <button onClick={() => setStep(4)} className="mt-8 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded w-full">VIEW ORDER</button>}
              </div>
            )}
          </motion.div>
        )}

        {/* STEP 4: ORDER TRACKING */}
        {step === 4 && (
          <motion.div key="4" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="max-w-3xl mx-auto dashboard-card p-10">
            <div className="text-center mb-12">
              <div className="w-20 h-20 bg-brand-success/20 text-brand-success rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <CheckCircle2 size={40}/>
              </div>
              <h1 className="text-3xl font-black mb-2 text-white">Order Confirmed!</h1>
              <p className="text-slate-400 font-mono text-sm">{order?.id ?? 'Loading...'}</p>
              <p className="text-slate-500 font-mono text-xs mt-1">Status: <span className="text-brand-success">{order?.status}</span></p>
              <p className="text-slate-500 font-mono text-xs">Total: <span className="text-white">₹{Number(order?.totalAmount).toLocaleString('en-IN')}</span></p>
            </div>

            <div className="relative pl-8 space-y-8 before:absolute before:inset-0 before:ml-3 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-brand-success before:via-brand-primary before:to-slate-800">
              {[
                { status: 'CREATED', label: 'ORDER CREATED', desc: 'Database confirmed', icon: <Package size={14}/> },
                { status: 'CONFIRMED', label: 'PAYMENT CONFIRMED', desc: `TXN: ${paymentId?.slice(0,8) ?? '—'}`, icon: <CreditCard size={14}/> },
                { status: 'PROCESSING', label: 'PROCESSING', desc: 'Warehouse allocation', icon: <RefreshCw size={14}/> },
                { status: 'SHIPPED', label: 'SHIPPED', desc: 'En route', icon: <Truck size={14}/> },
                { status: 'DELIVERED', label: 'DELIVERED', desc: 'Estimated 2-3 days', icon: <CheckCircle2 size={14}/> },
              ].map((e, i) => {
                const isComplete = currentStatusIdx >= i;
                return (
                  <div key={i} className="relative flex items-start gap-6">
                    <div className={`w-6 h-6 rounded-full border-4 border-brand-surface shadow shrink-0 flex items-center justify-center -ml-0 ${isComplete ? 'bg-brand-success text-white' : 'bg-slate-700 text-slate-500'}`}>
                      {isComplete ? <CheckCircle2 size={12}/> : <span className="w-2 h-2 rounded-full bg-slate-600"/>}
                    </div>
                    <div className={`p-4 rounded-xl border flex-1 shadow ${isComplete ? 'border-brand-success/30 bg-brand-success/5' : 'border-brand-border bg-brand-bg'}`}>
                      <h3 className={`font-bold text-sm uppercase tracking-wider ${isComplete ? 'text-brand-success' : 'text-slate-500'}`}>{e.label}</h3>
                      <p className="text-xs text-slate-500 mt-1 font-mono">{e.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={resetFlow} className="mt-10 secondary-btn w-full">NEW PURCHASE</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
