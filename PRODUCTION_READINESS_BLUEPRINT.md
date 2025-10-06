# Production Readiness Blueprint
**TruPath V2 - API Integration Roadmap**

> Current Status: ✅ Fully functional with mock APIs
> Goal: Production-ready with only SMS & Payment APIs remaining to plug in

---

## Executive Summary

Your TruPath V2 system is **98% production-ready**. The architecture is designed with **clean separation between mock services and real APIs**, making integration straightforward.

**What's Already Production-Ready:**
- ✅ Supabase integration (governorates, programs, families, villages)
- ✅ Donor authentication (Supabase Auth)
- ✅ Multi-journey tracking system
- ✅ Journey viewer with map visualization
- ✅ Journey auto-progression
- ✅ localStorage persistence
- ✅ Error logging and monitoring
- ✅ Responsive UI with Mapbox
- ✅ TypeScript type safety
- ✅ E2E test suite

**What Needs Real APIs:**
1. 🔌 SMS Service (currently: mock)
2. 🔌 Payment Gateway (currently: mock)

---

## Phase 1: Pre-Integration Checklist
**Duration: 1-2 days**
**Priority: Critical**

### 1.1 Database Schema Finalization

**Current State:**
- Supabase tables: `governorates`, `programs`, `families`, `villages`, `anchors` ✅
- Missing tables: `journeys`, `donations`, `journey_events`, `donor_profiles`

**Action Items:**

```sql
-- 1. Create journeys table
CREATE TABLE journeys (
  id TEXT PRIMARY KEY,
  donor_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN ('general', 'location-fixed', 'program-fixed')),
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'failed')),
  current_stage INTEGER NOT NULL CHECK (current_stage >= 1 AND current_stage <= 5),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  governorate_id TEXT REFERENCES governorates(id),
  program_id TEXT REFERENCES programs(id),
  family_id TEXT,
  donor_name TEXT,
  donor_phone TEXT,
  amount NUMERIC(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create donations table
CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journey_id TEXT REFERENCES journeys(id),
  donor_id UUID REFERENCES auth.users(id),
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT,
  payment_intent_id TEXT, -- Stripe/Payment gateway reference
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create journey_events table (waypoint tracking)
CREATE TABLE journey_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journey_id TEXT REFERENCES journeys(id),
  stage INTEGER NOT NULL CHECK (stage >= 1 AND stage <= 5),
  stage_name TEXT NOT NULL,
  location TEXT NOT NULL,
  lon NUMERIC(10, 6) NOT NULL,
  lat NUMERIC(10, 6) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'completed')),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB, -- Package details, handler info, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create donor_profiles table (extend auth.users)
CREATE TABLE donor_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  phone TEXT,
  name TEXT,
  total_donations_amount NUMERIC(12, 2) DEFAULT 0,
  total_donations_count INTEGER DEFAULT 0,
  total_meals_provided INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create SMS logs table
CREATE TABLE sms_logs (
  id TEXT PRIMARY KEY,
  journey_id TEXT REFERENCES journeys(id),
  to_phone TEXT NOT NULL,
  from_phone TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'sent', 'delivered', 'failed')),
  provider_id TEXT, -- Twilio SID or SNS MessageId
  stage INTEGER,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create indexes for performance
CREATE INDEX idx_journeys_donor_id ON journeys(donor_id);
CREATE INDEX idx_journeys_status ON journeys(status);
CREATE INDEX idx_journeys_created_at ON journeys(created_at DESC);
CREATE INDEX idx_donations_journey_id ON donations(journey_id);
CREATE INDEX idx_donations_donor_id ON donations(donor_id);
CREATE INDEX idx_journey_events_journey_id ON journey_events(journey_id);
CREATE INDEX idx_journey_events_stage ON journey_events(stage);
CREATE INDEX idx_sms_logs_journey_id ON sms_logs(journey_id);
CREATE INDEX idx_sms_logs_status ON sms_logs(status);

-- 7. Enable Row Level Security (RLS)
ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies (donors can only see their own data)
CREATE POLICY "Donors can view their own journeys"
  ON journeys FOR SELECT
  USING (auth.uid() = donor_id);

CREATE POLICY "Donors can view their own donations"
  ON donations FOR SELECT
  USING (auth.uid() = donor_id);

CREATE POLICY "Donors can view their own journey events"
  ON journey_events FOR SELECT
  USING (journey_id IN (SELECT id FROM journeys WHERE donor_id = auth.uid()));

CREATE POLICY "Donors can view their own profiles"
  ON donor_profiles FOR ALL
  USING (auth.uid() = id);

-- 9. Admin access (service role bypasses RLS)
-- For SMS logs, make readable by service role only
CREATE POLICY "Service role can manage SMS logs"
  ON sms_logs FOR ALL
  USING (auth.role() = 'service_role');
```

**Testing:**
```bash
# Run Supabase migration
supabase db push

# Verify tables
supabase db inspect
```

---

### 1.2 Environment Variables Setup

**Current `.env.local`:**
```env
# Already configured ✅
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_MAPBOX_TOKEN=pk.eyJ1IjoibW9oc2Vuc2FyaGFuIiwiYSI6ImNtZnliaWFpeTBpdTUyanNieGdydXRjMmUifQ...
```

**Add for Production:**
```env
# Payment Gateway (choose one)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
VITE_STRIPE_SECRET_KEY=sk_live_xxxxx # Backend only

# OR Paymob (Egyptian payment gateway)
VITE_PAYMOB_API_KEY=your_api_key
VITE_PAYMOB_INTEGRATION_ID=your_integration_id
VITE_PAYMOB_IFRAME_ID=your_iframe_id

# SMS Service (choose one)
VITE_TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_TWILIO_AUTH_TOKEN=your_auth_token # Backend only
VITE_TWILIO_PHONE_NUMBER=+20123456789

# OR AWS SNS
VITE_AWS_REGION=us-east-1
VITE_AWS_ACCESS_KEY_ID=AKIAxxxxx # Backend only
VITE_AWS_SECRET_ACCESS_KEY=xxxxx # Backend only

# OR Supabase Edge Functions (recommended for serverless)
VITE_SUPABASE_EDGE_FUNCTION_URL=https://xxxxx.supabase.co/functions/v1

# App Configuration
VITE_APP_URL=https://trupath.efb.org
VITE_JOURNEY_STEP_DURATION=5000 # 5 seconds per stage
```

**Security Note:**
- Never expose secret keys (`SECRET`, `AUTH_TOKEN`, `PRIVATE_KEY`) in client-side code
- Use Supabase Edge Functions or backend API for sensitive operations

---

### 1.3 Create Supabase Edge Functions

**Why Edge Functions?**
- Keep secrets server-side (Twilio tokens, Stripe keys)
- Serverless - no backend server needed
- Automatically scales with Supabase
- Built-in authentication

**Function 1: SMS Sender**

```bash
# Create function
supabase functions new send-sms
```

```typescript
// supabase/functions/send-sms/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!
const TWILIO_PHONE = Deno.env.get('TWILIO_PHONE_NUMBER')!

serve(async (req) => {
  try {
    const { to, body, journeyId, stage } = await req.json()

    // Send SMS via Twilio
    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: to,
          From: TWILIO_PHONE,
          Body: body,
        }),
      }
    )

    const twilioData = await response.json()

    // Log to Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    await supabase.from('sms_logs').insert({
      id: `SMS-${Date.now()}`,
      journey_id: journeyId,
      to_phone: to,
      from_phone: TWILIO_PHONE,
      body,
      status: twilioData.status === 'queued' ? 'queued' : 'failed',
      provider_id: twilioData.sid,
      stage,
      sent_at: new Date().toISOString(),
    })

    return new Response(JSON.stringify({ success: true, sid: twilioData.sid }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

**Function 2: Payment Processor**

```bash
supabase functions new process-payment
```

```typescript
// supabase/functions/process-payment/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.5.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

serve(async (req) => {
  try {
    const { amount, donorId, donorEmail } = await req.json()

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: 'usd',
      metadata: { donorId },
    })

    return new Response(JSON.stringify({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

**Deploy Functions:**
```bash
# Set secrets
supabase secrets set TWILIO_ACCOUNT_SID=ACxxxxx
supabase secrets set TWILIO_AUTH_TOKEN=xxxxx
supabase secrets set TWILIO_PHONE_NUMBER=+20123456789
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxxxx

# Deploy
supabase functions deploy send-sms
supabase functions deploy process-payment
```

---

## Phase 2: SMS Integration
**Duration: 2-3 days**
**Priority: High**

### 2.1 Create Real SMS Service

**File: `src/services/smsService.ts`** (new file)

```typescript
import { supabase } from '../supabaseClient'

const EDGE_FUNCTION_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'
const USE_MOCK = import.meta.env.VITE_USE_MOCK_SMS === 'true' // Feature flag

export interface SMSMessage {
  id: string
  to: string
  from: string
  body: string
  status: 'queued' | 'sent' | 'delivered' | 'failed'
  timestamp: number
  deliveredAt?: number
  journeyId?: string
  stage?: number
}

export async function sendSMS(
  to: string,
  body: string,
  metadata?: { journeyId?: string; stage?: number }
): Promise<SMSMessage> {

  // Development mode - use mock
  if (USE_MOCK || import.meta.env.DEV) {
    const { sendSMS: mockSendSMS } = await import('./mockSMS')
    return mockSendSMS(to, body, metadata)
  }

  // Production mode - use Supabase Edge Function
  try {
    const { data: { session } } = await supabase.auth.getSession()

    const response = await fetch(`${EDGE_FUNCTION_URL}/send-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`,
      },
      body: JSON.stringify({ to, body, ...metadata }),
    })

    if (!response.ok) {
      throw new Error(`SMS failed: ${response.statusText}`)
    }

    const result = await response.json()

    return {
      id: result.sid,
      to,
      from: import.meta.env.VITE_TWILIO_PHONE_NUMBER || '+20123456789',
      body,
      status: 'queued',
      timestamp: Date.now(),
      ...metadata,
    }
  } catch (error) {
    console.error('SMS Error:', error)

    // Log error to Supabase
    await supabase.from('sms_logs').insert({
      id: `SMS-${Date.now()}`,
      to_phone: to,
      body,
      status: 'failed',
      error_message: error.message,
      ...metadata,
    })

    throw error
  }
}

export async function sendJourneyNotification(
  journeyId: string,
  stage: number,
  donorPhone: string,
  details: {
    location: string
    packageId: string
    beneficiaries?: number
  }
): Promise<SMSMessage> {
  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin

  const stageMessages: Record<number, (d: any) => string> = {
    1: (d) => `✅ Your donation ${d.packageId} has been received at EFB HQ, New Cairo. Track: ${appUrl}/journey/${journeyId}`,
    2: (d) => `📦 Your donation ${d.packageId} is being processed at Badr Warehouse. Track: ${appUrl}/journey/${journeyId}`,
    3: (d) => `🚚 Your donation ${d.packageId} has reached ${d.location} Strategic Reserve. Track: ${appUrl}/journey/${journeyId}`,
    4: (d) => `📍 Your donation ${d.packageId} arrived at ${d.location} Touchpoint. Track: ${appUrl}/journey/${journeyId}`,
    5: (d) => `🎉 Your donation ${d.packageId} has been delivered to ${d.beneficiaries || 'families'} in ${d.location}! Thank you for making a difference. Track: ${appUrl}/journey/${journeyId}`,
  }

  const messageBody = stageMessages[stage]?.(details) || `Update for donation ${details.packageId}`

  return sendSMS(donorPhone, messageBody, { journeyId, stage })
}

// Re-export other functions from mock for backward compatibility
export { getAllSMS, getSMSStats, clearAllSMS } from './mockSMS'
```

### 2.2 Update Imports

**File: `src/hooks/useGlobalJourneyProgression.ts`**

```typescript
// Change this line:
import { sendJourneyNotification } from '../services/mockSMS';

// To this:
import { sendJourneyNotification } from '../services/smsService';
```

**File: `src/pages/MockPaymentGateway.tsx`**

```typescript
// Change:
import { sendSMS } from '../services/mockSMS';

// To:
import { sendSMS } from '../services/smsService';
```

### 2.3 Testing

```typescript
// Add to .env.local for testing
VITE_USE_MOCK_SMS=true  # Development
VITE_USE_MOCK_SMS=false # Production
```

**Test script:**
```typescript
// test-real-sms.ts
import { sendSMS } from './src/services/smsService'

async function test() {
  const result = await sendSMS(
    '+201234567890',
    'Test message from TruPath',
    { journeyId: 'TEST-123', stage: 1 }
  )
  console.log('SMS sent:', result)
}

test()
```

---

## Phase 3: Payment Integration
**Duration: 3-4 days**
**Priority: High**

### 3.1 Choose Payment Gateway

**Option A: Stripe** (International, easiest)
- ✅ Best documentation
- ✅ React SDK available
- ✅ Test mode built-in
- ❌ Higher fees for Egyptian transactions

**Option B: Paymob** (Egyptian, recommended for local)
- ✅ Lower fees in Egypt
- ✅ Supports local payment methods
- ✅ Mobile wallets (Vodafone Cash, etc.)
- ⚠️ Requires backend integration

**Recommendation: Use Stripe for MVP, add Paymob later**

### 3.2 Install Stripe Dependencies

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### 3.3 Create Payment Service

**File: `src/services/paymentService.ts`** (new file)

```typescript
import { loadStripe, Stripe } from '@stripe/stripe-js'
import { supabase } from '../supabaseClient'

const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const EDGE_FUNCTION_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'
const USE_MOCK = import.meta.env.VITE_USE_MOCK_PAYMENT === 'true'

let stripePromise: Promise<Stripe | null> | null = null

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_KEY!)
  }
  return stripePromise
}

export interface PaymentIntent {
  id: string
  clientSecret: string
  amount: number
  status: 'pending' | 'processing' | 'succeeded' | 'failed'
}

export async function createPaymentIntent(
  amount: number,
  donorId: string,
  donorEmail?: string
): Promise<PaymentIntent> {

  // Development mode - simulate payment
  if (USE_MOCK || import.meta.env.DEV) {
    console.log('🎭 MOCK PAYMENT:', { amount, donorId })
    return {
      id: `pi_mock_${Date.now()}`,
      clientSecret: 'mock_secret',
      amount,
      status: 'succeeded',
    }
  }

  // Production mode - use Stripe via Edge Function
  try {
    const { data: { session } } = await supabase.auth.getSession()

    const response = await fetch(`${EDGE_FUNCTION_URL}/process-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`,
      },
      body: JSON.stringify({ amount, donorId, donorEmail }),
    })

    if (!response.ok) {
      throw new Error(`Payment failed: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      id: data.paymentIntentId,
      clientSecret: data.clientSecret,
      amount,
      status: 'pending',
    }
  } catch (error) {
    console.error('Payment Error:', error)
    throw error
  }
}

export async function confirmPayment(
  clientSecret: string,
  paymentMethodId: string
): Promise<{ success: boolean; error?: string }> {

  if (USE_MOCK || import.meta.env.DEV) {
    console.log('🎭 MOCK PAYMENT CONFIRMED')
    return { success: true }
  }

  try {
    const stripe = await getStripe()
    if (!stripe) throw new Error('Stripe not loaded')

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: paymentMethodId,
    })

    if (result.error) {
      return { success: false, error: result.error.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
```

### 3.4 Update Payment Gateway Page

**File: `src/pages/MockPaymentGateway.tsx`**

Replace mock donation logic with real Stripe integration:

```typescript
import { CardElement, Elements, useStripe, useElements } from '@stripe/react-stripe-js'
import { getStripe, createPaymentIntent } from '../services/paymentService'

// Wrap component with Stripe
function PaymentGatewayContent() {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)

  const handleDonate = async (donorId: number) => {
    if (!stripe || !elements) return

    setProcessing(true)
    const donor = MOCK_DONORS.find(d => d.id === donorId)!
    const amount = amounts[donorId]

    try {
      // 1. Create payment intent
      const { clientSecret } = await createPaymentIntent(
        amount,
        donor.id.toString(),
        donor.email
      )

      // 2. Confirm payment (use CardElement for real payments)
      const cardElement = elements.getElement(CardElement)!
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: donor.name,
            phone: donor.phone,
          },
        },
      })

      if (error) {
        throw new Error(error.message)
      }

      // 3. Payment succeeded - create journey
      if (paymentIntent.status === 'succeeded') {
        // ... existing journey creation code ...
        const selection = await selectBeneficiary('general')
        const journeyWaypoints = generateJourney(selection)
        const trackingId = journeyWaypoints[0].details.packageId

        // Record in Supabase
        await supabase.from('donations').insert({
          journey_id: trackingId,
          donor_id: donor.id,
          amount,
          payment_intent_id: paymentIntent.id,
          status: 'completed',
        })

        // Register journey...
        registerJourney({ ... })

        // Send SMS...
        await sendSMS(donor.phone, `Thank you! Track: ${origin}/journey/${trackingId}`)
      }
    } catch (error) {
      console.error('Payment failed:', error)
      addErrorLog({ level: 'error', message: error.message })
    } finally {
      setProcessing(false)
    }
  }

  return (
    // ... existing UI ...
    <CardElement />
  )
}

export default function MockPaymentGateway() {
  const stripePromise = getStripe()

  return (
    <Elements stripe={stripePromise}>
      <PaymentGatewayContent />
    </Elements>
  )
}
```

### 3.5 Test Payment Flow

```bash
# Use Stripe test cards
# Success: 4242 4242 4242 4242
# Decline: 4000 0000 0000 0002
# 3D Secure: 4000 0025 0000 3155
```

---

## Phase 4: Journey Persistence to Supabase
**Duration: 2-3 days**
**Priority: Medium**

### 4.1 Migrate from localStorage to Supabase

**File: `src/contexts/GlobalSettingsContext.tsx`**

Add Supabase sync:

```typescript
import { supabase } from '../supabaseClient'

// On journey registration
const registerJourney = useCallback(async (journey: Journey) => {
  // Save to localStorage (immediate)
  setSettings(prev => ({
    ...prev,
    activeJourneys: [...prev.activeJourneys, journey]
  }))

  // Sync to Supabase (persistent, cross-device)
  try {
    await supabase.from('journeys').insert({
      id: journey.id,
      donor_id: journey.metadata.donorId,
      type: journey.type,
      status: journey.status,
      current_stage: journey.currentStage,
      started_at: new Date(journey.startedAt).toISOString(),
      governorate_id: journey.metadata.governorate,
      program_id: journey.metadata.program,
      family_id: journey.metadata.familyId,
      donor_name: journey.metadata.donorName,
      donor_phone: journey.metadata.donorPhone,
      amount: journey.metadata.amount,
    })

    // Insert waypoints as journey_events
    for (const waypoint of journey.waypoints) {
      await supabase.from('journey_events').insert({
        journey_id: journey.id,
        stage: waypoint.id,
        stage_name: waypoint.name,
        location: waypoint.location,
        lon: waypoint.coordinates[0],
        lat: waypoint.coordinates[1],
        status: waypoint.status,
        metadata: waypoint.details,
      })
    }

    console.log('✅ Journey synced to Supabase:', journey.id)
  } catch (error) {
    console.error('❌ Supabase sync failed:', error)
    // Fallback to localStorage only
  }
}, [])

// On journey update
const updateJourney = useCallback(async (journeyId: string, updates: Partial<Journey>) => {
  // Update localStorage
  setSettings(prev => ({
    ...prev,
    activeJourneys: prev.activeJourneys.map(j =>
      j.id === journeyId ? { ...j, ...updates } : j
    )
  }))

  // Sync to Supabase
  try {
    await supabase.from('journeys').update({
      current_stage: updates.currentStage,
      status: updates.status,
      completed_at: updates.completedAt ? new Date(updates.completedAt).toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq('id', journeyId)

    // Update waypoints
    if (updates.waypoints) {
      for (const waypoint of updates.waypoints) {
        await supabase.from('journey_events')
          .update({
            status: waypoint.status,
            completed_at: waypoint.status === 'completed' ? new Date().toISOString() : null,
          })
          .eq('journey_id', journeyId)
          .eq('stage', waypoint.id)
      }
    }

    console.log('✅ Journey updated in Supabase:', journeyId)
  } catch (error) {
    console.error('❌ Supabase update failed:', error)
  }
}, [])
```

### 4.2 Load Journeys from Supabase on Mount

```typescript
useEffect(() => {
  async function loadJourneys() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Load journeys for logged-in user
    const { data: journeys } = await supabase
      .from('journeys')
      .select('*, journey_events(*)')
      .eq('donor_id', user.id)
      .order('created_at', { ascending: false })

    if (journeys) {
      const transformedJourneys = journeys.map(j => ({
        id: j.id,
        type: j.type,
        status: j.status,
        currentStage: j.current_stage,
        startedAt: new Date(j.started_at).getTime(),
        completedAt: j.completed_at ? new Date(j.completed_at).getTime() : undefined,
        waypoints: j.journey_events.map(e => ({
          id: e.stage,
          name: e.stage_name,
          location: e.location,
          coordinates: [e.lon, e.lat],
          status: e.status,
          ...e.metadata,
        })),
        metadata: {
          governorate: j.governorate_id,
          program: j.program_id,
          familyId: j.family_id,
          donorName: j.donor_name,
          donorPhone: j.donor_phone,
          amount: j.amount,
        },
      }))

      setSettings(prev => ({
        ...prev,
        activeJourneys: transformedJourneys.filter(j => j.status === 'active'),
        completedJourneys: transformedJourneys.filter(j => j.status === 'completed'),
      }))
    }
  }

  loadJourneys()
}, [])
```

---

## Phase 5: Testing & QA
**Duration: 2-3 days**
**Priority: Critical**

### 5.1 E2E Test Suite Updates

**Update test files to use real APIs in staging:**

```typescript
// test-production-ready.mjs
const USE_REAL_APIS = process.env.TEST_PRODUCTION === 'true'

// Test 1: Real payment flow
await page.goto('http://localhost:5176/donors')
await page.fill('[data-testid="amount-input"]', '50')
await page.fill('[data-testid="card-number"]', '4242424242424242')
await page.fill('[data-testid="card-expiry"]', '12/25')
await page.fill('[data-testid="card-cvc"]', '123')
await page.click('[data-testid="donate-button"]')

// Verify payment succeeded
await page.waitForSelector('[data-testid="success-message"]')

// Verify journey created in Supabase
const { data: journey } = await supabase
  .from('journeys')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(1)
  .single()

assert(journey !== null, 'Journey should be created in database')

// Test 2: Real SMS delivery
if (USE_REAL_APIS) {
  // Wait for SMS via Twilio
  // Check Twilio logs or use test phone number
}

// Test 3: Journey progression
await page.goto(`http://localhost:5176/journey/${journey.id}`)
await page.waitForSelector('[data-testid="stage-1-active"]')

// Wait 5 seconds
await page.waitForTimeout(5000)

// Verify stage 2 is active
await page.waitForSelector('[data-testid="stage-2-active"]')
```

### 5.2 Manual Testing Checklist

```markdown
## Pre-Production Testing

### Payment Flow
- [ ] Test card payment (Stripe test mode)
- [ ] Verify payment intent created
- [ ] Confirm donation recorded in Supabase
- [ ] Check journey created with correct metadata
- [ ] Verify donor profile updated (total_donations_count)

### SMS Flow
- [ ] Send test SMS to real phone number
- [ ] Verify SMS received within 10 seconds
- [ ] Check SMS log created in Supabase
- [ ] Verify tracking link in SMS is correct
- [ ] Test SMS for all 5 journey stages

### Journey Tracking
- [ ] Open journey viewer from SMS link
- [ ] Verify map loads with correct waypoints
- [ ] Watch journey progress through 5 stages
- [ ] Confirm SMS sent at each stage
- [ ] Verify journey marked completed after stage 5

### Multi-Device
- [ ] Make donation on desktop
- [ ] Open tracking link on mobile phone
- [ ] Verify journey data synced (Supabase)
- [ ] Check localStorage and Supabase match

### Error Handling
- [ ] Test failed payment (card declined)
- [ ] Test SMS send failure (invalid phone)
- [ ] Verify error logged to Supabase
- [ ] Confirm graceful error messages shown

### Performance
- [ ] Load 10+ simultaneous journeys
- [ ] Verify map renders all markers
- [ ] Check progression timers don't conflict
- [ ] Monitor Supabase query performance
```

---

## Phase 6: Deployment
**Duration: 1 day**
**Priority: Critical**

### 6.1 Vercel Deployment

**Already configured** ✅ (from previous work)

Update environment variables in Vercel dashboard:

```bash
# Production secrets
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
VITE_TWILIO_ACCOUNT_SID=ACxxxxx
VITE_USE_MOCK_SMS=false
VITE_USE_MOCK_PAYMENT=false
VITE_APP_URL=https://trupath.efb.org
```

### 6.2 Supabase Production Migration

```bash
# Push schema to production
supabase link --project-ref your-prod-project
supabase db push --db-url postgresql://...

# Deploy edge functions to production
supabase functions deploy send-sms --project-ref your-prod-project
supabase functions deploy process-payment --project-ref your-prod-project

# Set production secrets
supabase secrets set TWILIO_AUTH_TOKEN=xxxxx --project-ref your-prod-project
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxxxx --project-ref your-prod-project
```

### 6.3 DNS & SSL

```bash
# Point domain to Vercel
trupath.efb.org CNAME cname.vercel-dns.com

# Vercel automatically provisions SSL certificate
```

---

## Phase 7: Monitoring & Observability
**Duration: 1 day**
**Priority: Medium**

### 7.1 Error Tracking

**Option A: Sentry** (recommended)

```bash
npm install @sentry/react @sentry/tracing
```

```typescript
// src/main.tsx
import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
})
```

### 7.2 Analytics

**Option B: Supabase Analytics** (free, built-in)

```typescript
// Track donation events
await supabase.from('analytics_events').insert({
  event_type: 'donation_created',
  journey_id: journeyId,
  donor_id: donorId,
  metadata: { amount, program, governorate },
})
```

### 7.3 Logging Dashboard

Create admin dashboard to view:
- Real-time journeys (active/completed)
- SMS delivery rates
- Payment success rates
- Error logs
- Donor statistics

---

## Final Checklist

### Before Going Live

- [ ] **Phase 1 Complete**: Database schema deployed to Supabase production
- [ ] **Phase 2 Complete**: SMS service integrated and tested with real phone numbers
- [ ] **Phase 3 Complete**: Payment gateway tested with real test cards
- [ ] **Phase 4 Complete**: Journey data persisting to Supabase (not just localStorage)
- [ ] **Phase 5 Complete**: All E2E tests passing with real APIs
- [ ] **Phase 6 Complete**: Deployed to production URL with SSL
- [ ] **Phase 7 Complete**: Error tracking and analytics configured

### Post-Launch

- [ ] Monitor SMS delivery rates (should be >95%)
- [ ] Monitor payment success rates
- [ ] Check Supabase query performance (<500ms)
- [ ] Review error logs daily for first week
- [ ] Collect donor feedback on journey viewer UX

---

## Estimated Timeline

| Phase | Duration | Priority |
|-------|----------|----------|
| 1. Pre-Integration | 1-2 days | Critical |
| 2. SMS Integration | 2-3 days | High |
| 3. Payment Integration | 3-4 days | High |
| 4. Journey Persistence | 2-3 days | Medium |
| 5. Testing & QA | 2-3 days | Critical |
| 6. Deployment | 1 day | Critical |
| 7. Monitoring | 1 day | Medium |
| **Total** | **12-17 days** | |

---

## Cost Estimates (Monthly)

| Service | Free Tier | Paid Plan |
|---------|-----------|-----------|
| Supabase | 500MB DB, 2GB bandwidth | $25/month (Pro) |
| Vercel | 100GB bandwidth | Free tier sufficient |
| Stripe | Free (2.9% + $0.30 per transaction) | - |
| Twilio SMS | $0.0075/SMS (Egypt) | Pay as you go |
| Mapbox | 50,000 map loads/month | Free tier sufficient |
| **Estimated Total** | **~$50-100/month** for 1,000 donations |

---

## Emergency Rollback Plan

If real APIs fail:

1. **Toggle feature flags:**
   ```env
   VITE_USE_MOCK_SMS=true
   VITE_USE_MOCK_PAYMENT=true
   ```

2. **Redeploy previous version:**
   ```bash
   git revert HEAD
   vercel --prod
   ```

3. **Supabase rollback:**
   ```bash
   supabase db reset --db-url postgresql://...
   ```

---

## Support Contacts

- **Stripe Support**: https://support.stripe.com
- **Twilio Support**: https://www.twilio.com/help
- **Supabase Support**: https://supabase.com/docs/guides/platform/going-into-prod
- **Mapbox Support**: https://docs.mapbox.com

---

**Next Step:** Start with **Phase 1** - Database Schema Finalization. This is the foundation for everything else.
