import { vi } from 'vitest';

export const mockMapboxGL = {
  Map: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    remove: vi.fn(),
    addControl: vi.fn(),
    removeControl: vi.fn(),
    fitBounds: vi.fn(),
    flyTo: vi.fn(),
    getCanvas: vi.fn(() => ({
      style: { cursor: '' },
    })),
  })),
  Marker: vi.fn(() => ({
    setLngLat: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
    remove: vi.fn(),
  })),
  NavigationControl: vi.fn(),
};