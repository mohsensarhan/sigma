/**
 * Mock SMS Service
 * Simulates Twilio/AWS SNS SMS notifications
 */

export interface SMSMessage {
  id: string;
  to: string; // Phone number
  from: string; // Sender ID
  body: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  timestamp: number;
  deliveredAt?: number;
  journeyId?: string;
  stage?: number;
}

// Mock SMS database - use localStorage for persistence
const getStoredMessages = (): SMSMessage[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('mockSMSMessages');
  return stored ? JSON.parse(stored) : [];
};

const setStoredMessages = (messages: SMSMessage[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('mockSMSMessages', JSON.stringify(messages));
};

let smsMessages: SMSMessage[] = getStoredMessages();
let messageCounter = parseInt(localStorage.getItem('mockSMSCounter') || '1');

/**
 * Send SMS notification
 */
export async function sendSMS(
  to: string,
  body: string,
  metadata?: { journeyId?: string; stage?: number }
): Promise<SMSMessage> {
  const message: SMSMessage = {
    id: `SMS-${Date.now()}-${messageCounter++}`,
    to,
    from: '+20123456789', // Mock Egyptian number
    body,
    status: 'queued',
    timestamp: Date.now(),
    ...metadata
  };

  // Simulate immediate queuing
  smsMessages.push(message);
  setStoredMessages(smsMessages);
  localStorage.setItem('mockSMSCounter', messageCounter.toString());

  console.log(`[SMS] Queued to ${to}: "${body.substring(0, 50)}..."`);

  // Simulate async delivery (500ms delay)
  setTimeout(() => {
    message.status = 'sent';
    setStoredMessages(smsMessages);
    console.log(`[SMS] Sent to ${to}`);

    // Simulate delivery confirmation (1s delay)
    setTimeout(() => {
      message.status = 'delivered';
      message.deliveredAt = Date.now();
      setStoredMessages(smsMessages);
      console.log(`[SMS] Delivered to ${to}`);
    }, 500);
  }, 500);

  return message;
}

/**
 * Send journey stage notification
 */
export async function sendJourneyNotification(
  journeyId: string,
  stage: number,
  donorPhone: string,
  details: {
    location: string;
    packageId: string;
    beneficiaries?: number;
  }
): Promise<SMSMessage> {
  // Get origin safely for both browser and test environments
  const getOrigin = () => {
    if (typeof window !== 'undefined' && window.location) {
      return window.location.origin;
    }
    return 'http://localhost:5173'; // Default for testing
  };
  
  const stageMessages: Record<number, (details: any) => string> = {
    1: (d) => `✅ Your donation ${d.packageId} has been received at EFB HQ, New Cairo. Track: ${getOrigin()}/journey/${journeyId}`,
    2: (d) => `📦 Your donation ${d.packageId} is being processed at Badr Warehouse. Track: ${getOrigin()}/journey/${journeyId}`,
    3: (d) => `🚚 Your donation ${d.packageId} has reached ${d.location} Strategic Reserve. Track: ${getOrigin()}/journey/${journeyId}`,
    4: (d) => `📍 Your donation ${d.packageId} arrived at ${d.location} Touchpoint. Track: ${getOrigin()}/journey/${journeyId}`,
    5: (d) => `🎉 Your donation ${d.packageId} has been delivered to ${d.beneficiaries || 'families'} in ${d.location}! Thank you for making a difference. Track: ${getOrigin()}/journey/${journeyId}`
  };

  const messageBody = stageMessages[stage]?.(details) || `Update for donation ${details.packageId}`;

  return sendSMS(donorPhone, messageBody, { journeyId, stage });
}

/**
 * Send bulk SMS to multiple recipients
 */
export async function sendBulkSMS(
  recipients: string[],
  body: string,
  metadata?: { journeyId?: string; stage?: number }
): Promise<SMSMessage[]> {
  const messages = await Promise.all(
    recipients.map(phone => sendSMS(phone, body, metadata))
  );

  console.log(`[SMS] Bulk sent to ${recipients.length} recipients`);

  return messages;
}

/**
 * Get SMS delivery status
 */
export function getSMSStatus(messageId: string): SMSMessage | undefined {
  return smsMessages.find(msg => msg.id === messageId);
}

/**
 * Get all SMS for a journey
 */
export function getJourneySMS(journeyId: string): SMSMessage[] {
  return smsMessages
    .filter(msg => msg.journeyId === journeyId)
    .sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Get SMS statistics
 */
export function getSMSStats() {
  const total = smsMessages.length;
  const queued = smsMessages.filter(m => m.status === 'queued').length;
  const sent = smsMessages.filter(m => m.status === 'sent').length;
  const delivered = smsMessages.filter(m => m.status === 'delivered').length;
  const failed = smsMessages.filter(m => m.status === 'failed').length;

  return {
    total,
    queued,
    sent,
    delivered,
    failed,
    deliveryRate: total > 0 ? (delivered / total) * 100 : 0
  };
}

/**
 * Get all SMS messages (for debugging)
 */
export function getAllSMS(): SMSMessage[] {
  // Refresh from localStorage to get latest messages
  smsMessages = getStoredMessages();
  return [...smsMessages].sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Clear all SMS (for testing)
 */
export function clearAllSMS() {
  smsMessages = [];
  messageCounter = 1;
  setStoredMessages(smsMessages);
  localStorage.setItem('mockSMSCounter', '1');
  console.log('[SMS] All messages cleared');
}

/**
 * Simulate SMS delivery failure (for testing)
 */
export function simulateSMSFailure(messageId: string, reason: string = 'Network error') {
  const message = smsMessages.find(msg => msg.id === messageId);
  if (message) {
    message.status = 'failed';
    setStoredMessages(smsMessages);
    console.log(`[SMS] Failed: ${messageId} - ${reason}`);
  }
}

// Export mock Twilio-like API
export const mockTwilio = {
  messages: {
    create: async (params: { to: string; body: string; from?: string }) => {
      return sendSMS(params.to, params.body);
    },
    list: () => getAllSMS(),
    get: (sid: string) => getSMSStatus(sid)
  },
  stats: getSMSStats
};

// Export mock AWS SNS-like API
export const mockSNS = {
  publish: async (params: { PhoneNumber: string; Message: string }) => {
    const message = await sendSMS(params.PhoneNumber, params.Message);
    return {
      MessageId: message.id,
      ResponseMetadata: {
        RequestId: `SNS-${Date.now()}`
      }
    };
  },
  listMessages: () => getAllSMS(),
  getMessageAttributes: (messageId: string) => getSMSStatus(messageId)
};
