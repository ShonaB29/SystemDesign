export class PaymentGateway {
  async charge(amount: number, idempotencyKey: string): Promise<{ success: boolean; reference?: string; reason?: string }> {
    // Mock payment gateway with simple simulation logic
    // We can simulate failure if the idempotencyKey ends with 'FAIL'
    // or timeout if it ends with 'TIMEOUT'
    
    if (idempotencyKey.endsWith('-FAIL')) {
      return { success: false, reason: 'INSUFFICIENT_FUNDS' };
    }
    
    if (idempotencyKey.endsWith('-TIMEOUT')) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      return { success: false, reason: 'TIMEOUT' };
    }

    return { success: true, reference: `TXN-${Math.random().toString(36).substring(2, 9).toUpperCase()}` };
  }
}
