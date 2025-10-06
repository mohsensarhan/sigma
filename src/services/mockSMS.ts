/**
 * Mock SMS Service
 * Simulates Twilio/AWS SNS SMS notifications
 * NOW WRITES TO SUPABASE AS PRIMARY SOURCE
 */

import { supabase } from '../supabaseClient';

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

let messageCounter = 1;

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
    ...metadata,
  };

  console.log(`📱 [MOCK SMS] Queued to ${to}: "${body.substring(0, 50)}..."`);

  // Write to Supabase immediately
  try {
    const { error } = await supabase.from('sms_logs').insert({
      id: message.id,
      to_phone: to,
      from_phone: message.from,
      body,
      status: 'queued',
      provider: 'mock',
      journey_id: metadata?.journeyId,
      stage: metadata?.stage,
      created_at: new Date(message.timestamp).toISOString(),
    });

    if (error) {
      console.error('Failed to write SMS to Supabase:', error);
    } else {
      console.log(`✅ SMS saved to Supabase: ${message.id}`);
    }
  } catch (error) {
    console.error('Error writing SMS to Supabase:', error);
  }

  // Simulate async delivery (500ms delay) and update Supabase
  setTimeout(async () => {
    message.status = 'sent';
    console.log(`📱 [MOCK SMS] Sent to ${to}`);

    try {
      await supabase
        .from('sms_logs')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', message.id);
    } catch (error) {
      console.error('Error updating SMS status to sent:', error);
    }

    // Simulate delivery confirmation (1s delay)
    setTimeout(async () => {
      message.status = 'delivered';
      message.deliveredAt = Date.now();
      console.log(`📱 [MOCK SMS] Delivered to ${to}`);

      try {
        await supabase
          .from('sms_logs')
          .update({
            status: 'delivered',
            delivered_at: new Date(message.deliveredAt).toISOString(),
          })
          .eq('id', message.id);
      } catch (error) {
        console.error('Error updating SMS status to delivered:', error);
      }
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
    1: (d) =>
      `✅ Your donation ${d.packageId} has been received at EFB HQ, New Cairo. Track: ${getOrigin()}/journey/${journeyId}`,
    2: (d) =>
      `📦 Your donation ${d.packageId} is being processed at Badr Warehouse. Track: ${getOrigin()}/journey/${journeyId}`,
    3: (d) =>
      `🚚 Your donation ${d.packageId} has reached ${d.location} Strategic Reserve. Track: ${getOrigin()}/journey/${journeyId}`,
    4: (d) =>
      `📍 Your donation ${d.packageId} arrived at ${d.location} Touchpoint. Track: ${getOrigin()}/journey/${journeyId}`,
    5: (d) =>
      `🎉 Your donation ${d.packageId} has been delivered to ${d.beneficiaries || 'families'} in ${d.location}! Thank you for making a difference. Track: ${getOrigin()}/journey/${journeyId}`,
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
  const messages = await Promise.all(recipients.map((phone) => sendSMS(phone, body, metadata)));

  console.log(`[SMS] Bulk sent to ${recipients.length} recipients`);

  return messages;
}

/**
 * Get SMS delivery status from Supabase
 */
export async function getSMSStatus(messageId: string): Promise<SMSMessage | undefined> {
  try {
    const { data, error } = await supabase
      .from('sms_logs')
      .select('*')
      .eq('id', messageId)
      .single();

    if (error || !data) {return undefined;}

    return {
      id: data.id,
      to: data.to_phone,
      from: data.from_phone || '+20123456789',
      body: data.body,
      status: data.status as any,
      timestamp: new Date(data.created_at).getTime(),
      deliveredAt: data.delivered_at ? new Date(data.delivered_at).getTime() : undefined,
      journeyId: data.journey_id || undefined,
      stage: data.stage || undefined,
    };
  } catch (error) {
    console.error('Error fetching SMS status:', error);
    return undefined;
  }
}

/**
 * Get all SMS for a journey from Supabase
 */
export async function getJourneySMS(journeyId: string): Promise<SMSMessage[]> {
  try {
    const { data, error } = await supabase
      .from('sms_logs')
      .select('*')
      .eq('journey_id', journeyId)
      .order('created_at', { ascending: true });

    if (error) {throw error;}

    return (data || []).map((log) => ({
      id: log.id,
      to: log.to_phone,
      from: log.from_phone || '+20123456789',
      body: log.body,
      status: log.status as any,
      timestamp: new Date(log.created_at).getTime(),
      deliveredAt: log.delivered_at ? new Date(log.delivered_at).getTime() : undefined,
      journeyId: log.journey_id || undefined,
      stage: log.stage || undefined,
    }));
  } catch (error) {
    console.error('Error fetching journey SMS:', error);
    return [];
  }
}

/**
 * Get SMS statistics from Supabase
 */
export async function getSMSStats() {
  try {
    const { data, error } = await supabase.from('sms_logs').select('status');

    if (error) {throw error;}

    const total = data?.length || 0;
    const queued = data?.filter((m) => m.status === 'queued').length || 0;
    const sent = data?.filter((m) => m.status === 'sent').length || 0;
    const delivered = data?.filter((m) => m.status === 'delivered').length || 0;
    const failed = data?.filter((m) => m.status === 'failed').length || 0;

    return {
      total,
      queued,
      sent,
      delivered,
      failed,
      deliveryRate: total > 0 ? (delivered / total) * 100 : 0,
    };
  } catch (error) {
    console.error('Error fetching SMS stats:', error);
    return {
      total: 0,
      queued: 0,
      sent: 0,
      delivered: 0,
      failed: 0,
      deliveryRate: 0,
    };
  }
}

/**
 * Get all SMS messages from Supabase (for debugging)
 */
export function getAllSMS(): SMSMessage[] {
  // This is now synchronous but returns data from Supabase
  // We'll update the calling code to use async version
  console.warn('getAllSMS() is deprecated. Use getAllSMSAsync() instead.');
  return [];
}

/**
 * Get all SMS messages from Supabase (async version)
 */
export async function getAllSMSAsync(): Promise<SMSMessage[]> {
  try {
    const { data, error } = await supabase
      .from('sms_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {throw error;}

    return (data || []).map((log) => ({
      id: log.id,
      to: log.to_phone,
      from: log.from_phone || '+20123456789',
      body: log.body,
      status: log.status as any,
      timestamp: new Date(log.created_at).getTime(),
      deliveredAt: log.delivered_at ? new Date(log.delivered_at).getTime() : undefined,
      journeyId: log.journey_id || undefined,
      stage: log.stage || undefined,
    }));
  } catch (error) {
    console.error('Error fetching all SMS:', error);
    return [];
  }
}

/**
 * Clear all SMS from Supabase (for testing)
 */
export async function clearAllSMS() {
  try {
    const { error } = await supabase.from('sms_logs').delete().neq('id', ''); // Delete all

    if (error) {throw error;}

    messageCounter = 1;
    console.log('🧹 All SMS messages cleared from Supabase');
  } catch (error) {
    console.error('Error clearing SMS from Supabase:', error);
  }
}

/**
 * Simulate SMS delivery failure (for testing)
 */
export async function simulateSMSFailure(messageId: string, reason: string = 'Network error') {
  try {
    await supabase
      .from('sms_logs')
      .update({
        status: 'failed',
        error_message: reason,
      })
      .eq('id', messageId);

    console.log(`[SMS] Failed: ${messageId} - ${reason}`);
  } catch (error) {
    console.error('Error simulating SMS failure:', error);
  }
}

// Export mock Twilio-like API
export const mockTwilio = {
  messages: {
    create: async (params: { to: string; body: string; from?: string }) => {
      return sendSMS(params.to, params.body);
    },
    list: () => getAllSMS(),
    get: (sid: string) => getSMSStatus(sid),
  },
  stats: getSMSStats,
};

// Export mock AWS SNS-like API
export const mockSNS = {
  publish: async (params: { PhoneNumber: string; Message: string }) => {
    const message = await sendSMS(params.PhoneNumber, params.Message);
    return {
      MessageId: message.id,
      ResponseMetadata: {
        RequestId: `SNS-${Date.now()}`,
      },
    };
  },
  listMessages: () => getAllSMS(),
  getMessageAttributes: (messageId: string) => getSMSStatus(messageId),
};
