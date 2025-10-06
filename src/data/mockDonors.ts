/**
 * Mock Donor Data
 * 4 donor profiles for payment gateway simulation
 */

export interface MockDonor {
  id: number;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  defaultAmount: number;
  totalDonated: number;
  donationCount: number;
  lastDonation?: {
    trackingId: string;
    amount: number;
    timestamp: number;
  };
}

export const MOCK_DONORS: MockDonor[] = [
  {
    id: 1,
    name: 'Ahmed Hassan',
    phone: '+201234567890',
    email: 'ahmed.hassan@example.com',
    avatar: '👨',
    defaultAmount: 50,
    totalDonated: 0,
    donationCount: 0,
  },
  {
    id: 2,
    name: 'Fatima Ali',
    phone: '+201235567890',
    email: 'fatima.ali@example.com',
    avatar: '👩',
    defaultAmount: 100,
    totalDonated: 0,
    donationCount: 0,
  },
  {
    id: 3,
    name: 'Mohamed Ibrahim',
    phone: '+201236567890',
    email: 'mohamed.ibrahim@example.com',
    avatar: '🧔',
    defaultAmount: 25,
    totalDonated: 0,
    donationCount: 0,
  },
  {
    id: 4,
    name: 'Sara Mahmoud',
    phone: '+201237567890',
    email: 'sara.mahmoud@example.com',
    avatar: '👩‍🦱',
    defaultAmount: 75,
    totalDonated: 0,
    donationCount: 0,
  },
];

// Donation history (in-memory storage)
interface DonationRecord {
  donorId: number;
  trackingId: string;
  amount: number;
  timestamp: number;
  donorName: string;
  status: 'pending' | 'processing' | 'completed';
}

let donationHistory: DonationRecord[] = [];

/**
 * Record a donation
 */
export function recordDonation(
  donorId: number,
  trackingId: string,
  amount: number
): DonationRecord {
  const donor = MOCK_DONORS.find((d) => d.id === donorId);
  if (!donor) {
    throw new Error(`Donor ${donorId} not found`);
  }

  const record: DonationRecord = {
    donorId,
    trackingId,
    amount,
    timestamp: Date.now(),
    donorName: donor.name,
    status: 'pending',
  };

  donationHistory.unshift(record); // Add to beginning
  donationHistory = donationHistory.slice(0, 50); // Keep last 50

  // Update donor stats
  donor.totalDonated += amount;
  donor.donationCount += 1;
  donor.lastDonation = {
    trackingId,
    amount,
    timestamp: record.timestamp,
  };

  console.log(`💰 Donation recorded: ${donor.name} donated $${amount} → ${trackingId}`);

  return record;
}

/**
 * Update donation status
 */
export function updateDonationStatus(trackingId: string, status: DonationRecord['status']): void {
  const donation = donationHistory.find((d) => d.trackingId === trackingId);
  if (donation) {
    donation.status = status;
    console.log(`📊 Donation ${trackingId} status: ${status}`);
  }
}

/**
 * Get all donation history
 */
export function getDonationHistory(): DonationRecord[] {
  return [...donationHistory];
}

/**
 * Get donations by donor
 */
export function getDonationsByDonor(donorId: number): DonationRecord[] {
  return donationHistory.filter((d) => d.donorId === donorId);
}

/**
 * Get donor by phone
 */
export function getDonorByPhone(phone: string): MockDonor | undefined {
  return MOCK_DONORS.find((d) => d.phone === phone);
}

/**
 * Get donor by ID
 */
export function getDonorById(id: number): MockDonor | undefined {
  return MOCK_DONORS.find((d) => d.id === id);
}

/**
 * Get donation stats
 */
export function getDonationStats() {
  const total = donationHistory.reduce((sum, d) => sum + d.amount, 0);
  const count = donationHistory.length;
  const average = count > 0 ? total / count : 0;

  const byDonor = MOCK_DONORS.map((donor) => ({
    name: donor.name,
    total: donor.totalDonated,
    count: donor.donationCount,
    average: donor.donationCount > 0 ? donor.totalDonated / donor.donationCount : 0,
  }));

  return {
    total,
    count,
    average,
    byDonor,
  };
}

/**
 * Clear all donation history
 */
export function clearDonationHistory(): void {
  donationHistory = [];
  MOCK_DONORS.forEach((donor) => {
    donor.totalDonated = 0;
    donor.donationCount = 0;
    donor.lastDonation = undefined;
  });
  console.log('🧹 Donation history cleared');
}
