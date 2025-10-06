/**
 * SMS Service - Production-Ready with Mock Fallback
 * Abstracts SMS sending to support multiple providers
 *
 * Usage:
 * - Development: Uses mock SMS (no real API calls)
 * - Production: Uses real SMS API (Twilio/AWS SNS) via Supabase Edge Function
 *
 * To switch: Set VITE_USE_MOCK_SMS=false in .env.local
 */

import { supabase } from '../supabaseClient';

// Re-export types from mockSMS for compatibility
export type { SMSMessage } from './mockSMS';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_SMS !== 'false'; // Default to mock
const EDGE_FUNCTION_URL = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
  : null;

/**
 * Send SMS via real API or mock
 */
export async function sendSMS(
  to: string,
  body: string,
  metadata?: { journeyId?: string; stage?: number }
): Promise<import('./mockSMS').SMSMessage> {
  // Development/Testing Mode - Use Mock
  if (USE_MOCK || !EDGE_FUNCTION_URL) {
    console.log('📱 [MOCK MODE] SMS would be sent to:', to);
    const { sendSMS: mockSendSMS } = await import('./mockSMS');
    return mockSendSMS(to, body, metadata);
  }

  // Production Mode - Use Real SMS API via Edge Function
  console.log('📱 [PRODUCTION] Sending real SMS to:', to);

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const response = await fetch(`${EDGE_FUNCTION_URL}/send-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
      },
      body: JSON.stringify({
        to,
        body,
        journeyId: metadata?.journeyId,
        stage: metadata?.stage,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(`SMS API Error: ${errorData.error || response.statusText}`);
    }

    const result = await response.json();

    // Return in mockSMS format for compatibility
    return {
      id: result.sid || result.id || `SMS-${Date.now()}`,
      to,
      from: result.from || import.meta.env.VITE_SMS_FROM_NUMBER || '+20123456789',
      body,
      status: 'queued',
      timestamp: Date.now(),
      journeyId: metadata?.journeyId,
      stage: metadata?.stage,
    };
  } catch (error: any) {
    console.error('❌ SMS Send Error:', error);

    // Log error to Supabase sms_logs
    try {
      await supabase.from('sms_logs').insert({
        id: `SMS-ERROR-${Date.now()}`,
        to_phone: to,
        body,
        status: 'failed',
        error_message: error.message,
        journey_id: metadata?.journeyId,
        stage: metadata?.stage,
        provider: 'edge_function',
        created_at: new Date().toISOString(),
      });
    } catch (logError) {
      console.error('Failed to log SMS error to Supabase:', logError);
    }

    // Fallback to mock on error (graceful degradation)
    console.warn('⚠️ Falling back to mock SMS due to error');
    const { sendSMS: mockSendSMS } = await import('./mockSMS');
    return mockSendSMS(to, body, metadata);
  }
}

/**
 * Send journey stage notification SMS
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
): Promise<import('./mockSMS').SMSMessage> {
  const appUrl =
    import.meta.env.VITE_APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173');

  const stageMessages: Record<number, (d: typeof details) => string> = {
    1: (d) =>
      `✅ Your donation ${d.packageId} has been received at EFB HQ, New Cairo. Track: ${appUrl}/journey/${journeyId}`,
    2: (d) =>
      `📦 Your donation ${d.packageId} is being processed at Badr Warehouse. Track: ${appUrl}/journey/${journeyId}`,
    3: (d) =>
      `🚚 Your donation ${d.packageId} has reached ${d.location} Strategic Reserve. Track: ${appUrl}/journey/${journeyId}`,
    4: (d) =>
      `📍 Your donation ${d.packageId} arrived at ${d.location} Touchpoint. Track: ${appUrl}/journey/${journeyId}`,
    5: (d) =>
      `🎉 Your donation ${d.packageId} has been delivered to ${d.beneficiaries || 'families'} in ${d.location}! Thank you for making a difference. Track: ${appUrl}/journey/${journeyId}`,
  };

  const messageBody =
    stageMessages[stage]?.(details) ||
    `Update for donation ${details.packageId}. Track: ${appUrl}/journey/${journeyId}`;

  return sendSMS(donorPhone, messageBody, { journeyId, stage });
}

/**
 * Send bulk SMS to multiple recipients
 */
export async function sendBulkSMS(
  recipients: string[],
  body: string,
  metadata?: { journeyId?: string; stage?: number }
): Promise<import('./mockSMS').SMSMessage[]> {
  console.log(`📱 Sending bulk SMS to ${recipients.length} recipients`);

  const messages = await Promise.all(recipients.map((phone) => sendSMS(phone, body, metadata)));

  return messages;
}

/**
 * Get all SMS messages (for debugging/admin)
 * In production, fetches from Supabase; in development, from localStorage
 */
export async function getAllSMS(): Promise<import('./mockSMS').SMSMessage[]> {
  if (USE_MOCK || !EDGE_FUNCTION_URL) {
    const { getAllSMS: mockGetAllSMS } = await import('./mockSMS');
    return mockGetAllSMS();
  }

  // Production: Fetch from Supabase
  try {
    const { data, error } = await supabase
      .from('sms_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {throw error;}

    // Transform to mockSMS format
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
    console.error('Error fetching SMS logs from Supabase:', error);

    // Fallback to mock
    const { getAllSMS: mockGetAllSMS } = await import('./mockSMS');
    return mockGetAllSMS();
  }
}

/**
 * Get SMS statistics
 */
export async function getSMSStats() {
  if (USE_MOCK || !EDGE_FUNCTION_URL) {
    const { getSMSStats: mockGetSMSStats } = await import('./mockSMS');
    return mockGetSMSStats();
  }

  // Production: Calculate from Supabase
  try {
    const { data, error } = await supabase.from('sms_logs').select('status');

    if (error) {throw error;}

    const total = data?.length || 0;
    const queued = data?.filter((s) => s.status === 'queued').length || 0;
    const sent = data?.filter((s) => s.status === 'sent').length || 0;
    const delivered = data?.filter((s) => s.status === 'delivered').length || 0;
    const failed = data?.filter((s) => s.status === 'failed').length || 0;

    return {
      total,
      queued,
      sent,
      delivered,
      failed,
      deliveryRate: total > 0 ? (delivered / total) * 100 : 0,
    };
  } catch (error) {
    console.error('Error fetching SMS stats from Supabase:', error);

    // Fallback to mock
    const { getSMSStats: mockGetSMSStats } = await import('./mockSMS');
    return mockGetSMSStats();
  }
}

/**
 * Clear all SMS (for testing)
 */
export async function clearAllSMS() {
  if (USE_MOCK || !EDGE_FUNCTION_URL) {
    const { clearAllSMS: mockClearAllSMS } = await import('./mockSMS');
    return mockClearAllSMS();
  }

  // Production: Clear from Supabase (admin only)
  try {
    const { error } = await supabase.from('sms_logs').delete().neq('id', ''); // Delete all

    if (error) {throw error;}

    console.log('🧹 All SMS logs cleared from Supabase');
  } catch (error) {
    console.error('Error clearing SMS logs from Supabase:', error);
  }
}

/**
 * Get SMS for a specific journey
 */
export async function getJourneySMS(journeyId: string): Promise<import('./mockSMS').SMSMessage[]> {
  if (USE_MOCK || !EDGE_FUNCTION_URL) {
    const { getJourneySMS: mockGetJourneySMS } = await import('./mockSMS');
    return mockGetJourneySMS(journeyId);
  }

  // Production: Fetch from Supabase
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
    console.error('Error fetching journey SMS from Supabase:', error);
    return [];
  }
}

// Log service mode on initialization
console.log(`📱 SMS Service initialized in ${USE_MOCK ? 'MOCK' : 'PRODUCTION'} mode`);
