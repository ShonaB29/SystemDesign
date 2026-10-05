const API_BASE = import.meta.env.VITE_API_BASE_URL;

// ─── Inventory ───────────────────────────────────────────────────────────────
export const inventoryApi = {
  getAvailability: async (productId: string) => {
    if (API_BASE && productId) {
      try {
        const res = await fetch(`${API_BASE}/inventory/${productId}`);
        if (!res.ok) throw new Error('inventory fetch failed');
        const json = await res.json();
        return json.data;
      } catch {
        // fall through to mock
      }
    }
    // Fetch first product's inventory from the backend bootstrap endpoint
    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/inventory`);
        if (res.ok) {
          const json = await res.json();
          return json.data;
        }
      } catch {}
    }
    // Mock Fallback
    return {
      productId: productId || 'mock-product',
      total: 100,
      available: 100,
      reserved: 0,
      sold: 0,
      isConsistent: true
    };
  }
};

// ─── Reservation ─────────────────────────────────────────────────────────────
export const reservationApi = {
  createAtomicReservation: async (productId: string, customerId: string) => {
    if (API_BASE) {
      const idempotencyKey = `RSV-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const res = await fetch(`${API_BASE}/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, customerId, quantity: 1, idempotencyKey })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.code || json.error?.message || 'RESERVATION_FAILED');
      return json.data;
    }
    // Mock Fallback — real-looking reservation shape
    return {
      id: `mock-rsv-${Date.now()}`,
      status: 'RESERVED',
      idempotencyKey: `RSV-MOCK-${Date.now()}`,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    };
  },

  releaseReservation: async (reservationId: string) => {
    if (API_BASE) {
      const res = await fetch(`${API_BASE}/reservations/${reservationId}/release`, { method: 'POST' });
      return (await res.json()).data;
    }
    return { status: 'RELEASED' };
  }
};

// ─── Payment ──────────────────────────────────────────────────────────────────
export const paymentApi = {
  processCharge: async (reservationId: string, amount: number, idempotencyKey: string) => {
    if (API_BASE) {
      const customerId = import.meta.env.VITE_CUSTOMER_ID || 'demo-customer';
      const res = await fetch(`${API_BASE}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId, customerId, amount, idempotencyKey })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'PAYMENT_FAILED');
      return json.data;
    }
    // Mock Fallback — simulate result based on key suffix
    const isFail = idempotencyKey.endsWith('-FAILURE');
    return {
      id: `mock-pay-${Date.now()}`,
      transactionId: `TXN-MOCK-${Math.random().toString(36).substring(7).toUpperCase()}`,
      status: isFail ? 'FAILED' : 'SUCCESS',
    };
  }
};

// ─── Order ───────────────────────────────────────────────────────────────────
export const orderApi = {
  createOrder: async (paymentId: string) => {
    if (API_BASE) {
      const customerId = import.meta.env.VITE_CUSTOMER_ID || 'demo-customer';
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, customerId, amount: 99999 })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'ORDER_FAILED');
      return json.data;
    }
    return {
      id: `mock-ord-${Date.now()}`,
      status: 'CONFIRMED',
      totalAmount: 99999
    };
  },

  getOrderByPaymentId: async (paymentId: string) => {
    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/orders/by-payment/${paymentId}`);
        if (!res.ok) return null;
        const json = await res.json();
        return json.data;
      } catch {
        return null;
      }
    }
    return null;
  }
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi = {
  getMetrics: async () => {
    if (API_BASE) {
      const res = await fetch(`${API_BASE}/dashboard/metrics`);
      if (!res.ok) throw new Error('Failed to fetch metrics');
      const json = await res.json();
      return json.data;
    }
    // Mock Fallback
    return {
      requests: 10000,
      totalInventory: 100,
      availableInventory: 100,
      reservedInventory: 0,
      soldInventory: 0,
      successfulSales: 0,
      overselling: 0,
      activeReservations: 0,
      paymentSuccessRate: '95%'
    };
  }
};
