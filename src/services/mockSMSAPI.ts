/**
 * Mock SMS API for Testing
 * Simulates SMS providers (Twilio/ClickSend) without real integration
 */

export interface MockSMS {
  id: string;
  to: string;
  message: string;
  timestamp: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sid: string;
}

export interface SMSTemplate {
  id: string;
  name: string;
  message: string;
  variables: string[];
}

class MockSMSAPI {
  private messages: MockSMS[] = [];
  private templates: SMSTemplate[] = [];
  private nextId = 1;
  private nextSid = 1;

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Initialize SMS templates
   */
  private initializeTemplates() {
    this.templates = [
      {
        id: 'thank_you',
        name: 'Thank You',
        message:
          'Thank you for your donation of {{amount}} {{currency}}! View your journey: {{journey_url}}',
        variables: ['amount', 'currency', 'journey_url'],
      },
      {
        id: 'step_1',
        name: 'Step 1 Notification',
        message:
          'Your donation has been received! Step 1: Collection. View progress: {{journey_url}}',
        variables: ['journey_url'],
      },
      {
        id: 'step_2',
        name: 'Step 2 Notification',
        message:
          'Great news! Step 2: Processing complete. Step 3: Transportation. View: {{journey_url}}',
        variables: ['journey_url'],
      },
      {
        id: 'step_3',
        name: 'Step 3 Notification',
        message:
          'Your donation is on the move! Step 3: Transportation. Step 4: Distribution. View: {{journey_url}}',
        variables: ['journey_url'],
      },
      {
        id: 'step_4',
        name: 'Step 4 Notification',
        message: 'Almost there! Step 4: Distribution. Step 5: Delivery. View: {{journey_url}}',
        variables: ['journey_url'],
      },
      {
        id: 'step_5',
        name: 'Step 5 Notification',
        message:
          'Success! Your donation has been delivered. Thank you for making a difference! View: {{journey_url}}',
        variables: ['journey_url'],
      },
      {
        id: 'journey_complete',
        name: 'Journey Complete',
        message:
          'Your donation journey is complete! You provided {{meals}} meals and helped {{lives}} people. Thank you!',
        variables: ['meals', 'lives'],
      },
    ];
  }

  /**
   * Send SMS
   */
  async sendSMS(to: string, message: string): Promise<MockSMS> {
    const newSMS: MockSMS = {
      id: `sms_${this.nextId++}`,
      to,
      message,
      timestamp: new Date().toISOString(),
      status: 'pending',
      sid: `SM_${this.nextSid++}_${Date.now()}`,
    };

    this.messages.push(newSMS);

    // Simulate SMS sending delay (1-2 seconds)
    const delay = Math.random() * 1000 + 500;
    setTimeout(() => {
      newSMS.status = 'sent';
      console.log(`📱 SMS Sent to ${to}: ${message}`);

      // Simulate delivery after another 1-2 seconds
      setTimeout(
        () => {
          newSMS.status = 'delivered';
          console.log(`✅ SMS Delivered to ${to}`);
        },
        Math.random() * 1000 + 500
      );
    }, delay);

    return newSMS;
  }

  /**
   * Send SMS using template
   */
  async sendSMSTemplate(
    to: string,
    templateId: string,
    variables: Record<string, string>
  ): Promise<MockSMS> {
    const template = this.templates.find((t) => t.id === templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    let message = template.message;

    // Replace variables in message
    template.variables.forEach((variable) => {
      const value = variables[variable];
      if (value !== undefined) {
        message = message.replace(new RegExp(`{{${variable}}}`, 'g'), value);
      }
    });

    return this.sendSMS(to, message);
  }

  /**
   * Send thank you SMS with journey URL
   */
  async sendThankYouSMS(
    to: string,
    amount: number,
    currency: string,
    journeyUrl: string
  ): Promise<MockSMS> {
    return this.sendSMSTemplate(to, 'thank_you', {
      amount: amount.toString(),
      currency,
      journey_url: journeyUrl,
    });
  }

  /**
   * Send step notification SMS
   */
  async sendStepSMS(to: string, step: number, journeyUrl: string): Promise<MockSMS> {
    return this.sendSMSTemplate(to, `step_${step}`, {
      journey_url: journeyUrl,
    });
  }

  /**
   * Send journey complete SMS
   */
  async sendJourneyCompleteSMS(to: string, meals: number, lives: number): Promise<MockSMS> {
    return this.sendSMSTemplate(to, 'journey_complete', {
      meals: meals.toString(),
      lives: lives.toString(),
    });
  }

  /**
   * Get all messages
   */
  getMessages(): MockSMS[] {
    return [...this.messages];
  }

  /**
   * Get messages by phone number
   */
  getMessagesByPhone(phone: string): MockSMS[] {
    return this.messages.filter((msg) => msg.to === phone);
  }

  /**
   * Get message by ID
   */
  getMessageById(id: string): MockSMS | undefined {
    return this.messages.find((msg) => msg.id === id);
  }

  /**
   * Get all templates
   */
  getTemplates(): SMSTemplate[] {
    return [...this.templates];
  }

  /**
   * Get template by ID
   */
  getTemplateById(id: string): SMSTemplate | undefined {
    return this.templates.find((template) => template.id === id);
  }

  /**
   * Clear all messages (for testing)
   */
  clearMessages(): void {
    this.messages = [];
    this.nextId = 1;
    this.nextSid = 1;
  }

  /**
   * Get SMS statistics
   */
  getStats() {
    const total = this.messages.length;
    const sent = this.messages.filter(
      (m) => m.status === 'sent' || m.status === 'delivered'
    ).length;
    const delivered = this.messages.filter((m) => m.status === 'delivered').length;
    const failed = this.messages.filter((m) => m.status === 'failed').length;
    const pending = this.messages.filter((m) => m.status === 'pending').length;

    return {
      total,
      sent,
      delivered,
      failed,
      pending,
      deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0,
    };
  }

  /**
   * Simulate SMS delivery for testing
   */
  async simulateDelivery(messageId: string): Promise<void> {
    const message = this.getMessageById(messageId);
    if (message && message.status === 'pending') {
      message.status = 'sent';
      console.log(`📱 SMS Sent to ${message.to}: ${message.message}`);

      setTimeout(
        () => {
          message.status = 'delivered';
          console.log(`✅ SMS Delivered to ${message.to}`);
        },
        Math.random() * 1000 + 500
      );
    }
  }

  /**
   * Simulate SMS failure for testing
   */
  async simulateFailure(messageId: string): Promise<void> {
    const message = this.getMessageById(messageId);
    if (message) {
      message.status = 'failed';
      console.log(`❌ SMS Failed to ${message.to}: ${message.message}`);
    }
  }
}

// Export singleton instance
export const mockSMSAPI = new MockSMSAPI();
