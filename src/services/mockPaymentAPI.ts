/**
 * Mock Payment API for Testing
 * Simulates AWS Payment Gateway webhooks without real integration
 */

export interface MockPayment {
  id: string;
  amount: number;
  currency: string;
  donorEmail?: string;
  donorName?: string;
  donorPhone?: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
  transactionId: string;
}

export interface MockPaymentWebhook {
  type: 'payment.completed' | 'payment.failed';
  data: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    metadata: {
      donor_email?: string;
      donor_name?: string;
      donor_phone?: string;
    };
    created: number;
  };
}

class MockPaymentAPI {
  private payments: MockPayment[] = [];
  private listeners: ((webhook: MockPaymentWebhook) => void)[] = [];
  private nextId = 1;

  constructor() {
    // Simulate some initial payments for testing
    this.simulateInitialPayments();
  }

  /**
   * Simulate receiving a payment webhook
   */
  async simulatePayment(payment: Omit<MockPayment, 'id' | 'timestamp' | 'status' | 'transactionId'>): Promise<MockPayment> {
    const newPayment: MockPayment = {
      ...payment,
      id: `payment_${this.nextId++}`,
      timestamp: new Date().toISOString(),
      status: 'completed',
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    this.payments.push(newPayment);

    // Simulate webhook delay (1-3 seconds)
    const delay = Math.random() * 2000 + 1000;
    setTimeout(() => {
      this.triggerWebhook({
        type: 'payment.completed',
        data: {
          id: newPayment.id,
          amount: newPayment.amount,
          currency: newPayment.currency,
          status: newPayment.status,
          metadata: {
            donor_email: newPayment.donorEmail,
            donor_name: newPayment.donorName,
            donor_phone: newPayment.donorPhone
          },
          created: Date.now()
        }
      });
    }, delay);

    return newPayment;
  }

  /**
   * Listen for payment webhooks
   */
  onPaymentWebhook(listener: (webhook: MockPaymentWebhook) => void) {
    this.listeners.push(listener);
  }

  /**
   * Remove webhook listener
   */
  offPaymentWebhook(listener: (webhook: MockPaymentWebhook) => void) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Trigger webhook to all listeners
   */
  private triggerWebhook(webhook: MockPaymentWebhook) {
    this.listeners.forEach(listener => {
      try {
        listener(webhook);
      } catch (error) {
        console.error('Error in webhook listener:', error);
      }
    });
  }

  /**
   * Get all payments
   */
  getPayments(): MockPayment[] {
    return [...this.payments];
  }

  /**
   * Get payment by ID
   */
  getPaymentById(id: string): MockPayment | undefined {
    return this.payments.find(payment => payment.id === id);
  }

  /**
   * Simulate initial payments for testing
   */
  private simulateInitialPayments() {
    const initialPayments = [
      {
        amount: 100,
        currency: 'USD',
        donorEmail: 'john.doe@example.com',
        donorName: 'John Doe',
        donorPhone: '+1234567890'
      },
      {
        amount: 250,
        currency: 'USD',
        donorEmail: 'jane.smith@example.com',
        donorName: 'Jane Smith',
        donorPhone: '+1987654321'
      },
      {
        amount: 500,
        currency: 'USD',
        donorEmail: 'mike.johnson@example.com',
        donorName: 'Mike Johnson',
        donorPhone: '+1122334455'
      }
    ];

    initialPayments.forEach((payment, index) => {
      setTimeout(() => {
        this.simulatePayment(payment);
      }, index * 2000); // Simulate payments every 2 seconds
    });
  }

  /**
   * Simulate a failed payment
   */
  async simulateFailedPayment(payment: Omit<MockPayment, 'id' | 'timestamp' | 'status' | 'transactionId'>): Promise<MockPayment> {
    const newPayment: MockPayment = {
      ...payment,
      id: `payment_failed_${this.nextId++}`,
      timestamp: new Date().toISOString(),
      status: 'failed',
      transactionId: `txn_failed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    this.payments.push(newPayment);

    // Simulate webhook delay
    const delay = Math.random() * 2000 + 1000;
    setTimeout(() => {
      this.triggerWebhook({
        type: 'payment.failed',
        data: {
          id: newPayment.id,
          amount: newPayment.amount,
          currency: newPayment.currency,
          status: newPayment.status,
          metadata: {
            donor_email: newPayment.donorEmail,
            donor_name: newPayment.donorName,
            donor_phone: newPayment.donorPhone
          },
          created: Date.now()
        }
      });
    }, delay);

    return newPayment;
  }

  /**
   * Clear all payments (for testing)
   */
  clearPayments(): void {
    this.payments = [];
    this.nextId = 1;
  }

  /**
   * Get payment statistics
   */
  getStats() {
    const total = this.payments.length;
    const completed = this.payments.filter(p => p.status === 'completed').length;
    const failed = this.payments.filter(p => p.status === 'failed').length;
    const totalAmount = this.payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      total,
      completed,
      failed,
      totalAmount,
      averageAmount: completed > 0 ? totalAmount / completed : 0
    };
  }
}

// Export singleton instance
export const mockPaymentAPI = new MockPaymentAPI();
