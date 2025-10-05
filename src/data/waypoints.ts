export interface Waypoint {
  id: number;
  name: string;
  location: string;
  coordinates: [number, number];
  stage: string;
  status: 'pending' | 'active' | 'completed';
  timestamp: string;
  journeyId?: string; // Add journey ID for multi-journey support
  details: {
    packageId: string;
    items: string[];
    quantity: number;
    beneficiaries: number;
    distanceFromPrevious?: number;
    estimatedTime?: string;
    temperature?: string;
    handler: string;
    familyProfile?: string;
  };
}

export const EGYPT_WAYPOINTS: Waypoint[] = [
  {
    id: 1,
    name: 'Donation Received',
    location: 'Egyptian Food Bank - Cairo',
    coordinates: [31.2357, 30.0444],
    stage: 'Stage 1',
    status: 'pending',
    timestamp: '2025-10-01 08:00:00',
    details: {
      packageId: 'EFB-2025-001247',
      items: ['Rice (25kg)', 'Cooking Oil (10L)', 'Lentils (15kg)', 'Sugar (10kg)'],
      quantity: 60,
      beneficiaries: 150,
      temperature: '22°C',
      handler: 'Ahmed Hassan',
    },
  },
  {
    id: 2,
    name: 'Processing',
    location: 'Alexandria Distribution Center',
    coordinates: [29.9187, 31.2001],
    stage: 'Stage 2',
    status: 'pending',
    timestamp: '2025-10-01 11:30:00',
    details: {
      packageId: 'EFB-2025-001247',
      items: ['Rice (25kg)', 'Cooking Oil (10L)', 'Lentils (15kg)', 'Sugar (10kg)'],
      quantity: 60,
      beneficiaries: 150,
      distanceFromPrevious: 221,
      estimatedTime: '3.5 hours',
      temperature: '24°C',
      handler: 'Fatima El-Sayed',
    },
  },
  {
    id: 3,
    name: 'Allocated',
    location: 'Luxor Community Center',
    coordinates: [32.6396, 25.6872],
    stage: 'Stage 3',
    status: 'pending',
    timestamp: '2025-10-01 18:45:00',
    details: {
      packageId: 'EFB-2025-001247',
      items: ['Rice (25kg)', 'Cooking Oil (10L)', 'Lentils (15kg)', 'Sugar (10kg)'],
      quantity: 60,
      beneficiaries: 150,
      distanceFromPrevious: 635,
      estimatedTime: '7.2 hours',
      temperature: '28°C',
      handler: 'Mohamed Ibrahim',
    },
  },
  {
    id: 4,
    name: 'In Transit',
    location: 'Aswan Relief Station',
    coordinates: [32.8998, 24.0889],
    stage: 'Stage 4',
    status: 'pending',
    timestamp: '2025-10-02 02:15:00',
    details: {
      packageId: 'EFB-2025-001247',
      items: ['Rice (25kg)', 'Cooking Oil (10L)', 'Lentils (15kg)', 'Sugar (10kg)'],
      quantity: 60,
      beneficiaries: 150,
      distanceFromPrevious: 231,
      estimatedTime: '3.8 hours',
      temperature: '26°C',
      handler: 'Sara Mahmoud',
    },
  },
  {
    id: 5,
    name: 'Delivered',
    location: 'Marsa Alam Final Delivery',
    coordinates: [34.8916, 25.0631],
    stage: 'Stage 5',
    status: 'pending',
    timestamp: '2025-10-02 08:30:00',
    details: {
      packageId: 'EFB-2025-001247',
      items: ['Rice (25kg)', 'Cooking Oil (10L)', 'Lentils (15kg)', 'Sugar (10kg)'],
      quantity: 60,
      beneficiaries: 150,
      distanceFromPrevious: 284,
      estimatedTime: '4.5 hours',
      temperature: '30°C',
      handler: 'Khaled Ahmed',
    },
  },
];

export const JOURNEY_METADATA = {
  donationId: 'EFB-2025-001247',
  totalDistance: 1371,
  totalDuration: '24.5 hours',
  totalBeneficiaries: 150,
  packageWeight: 60,
  status: 'In Progress',
  priority: 'High',
  route: 'Egypt Southern Corridor',
};
