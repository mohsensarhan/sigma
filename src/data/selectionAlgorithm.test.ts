import { describe, it, expect } from 'vitest';
import { selectBeneficiary } from './selectionAlgorithm';

describe('selectionAlgorithm', () => {
  describe('selectBeneficiary', () => {
    it('should select random program and governorate for general donation', async () => {
      const result = await selectBeneficiary('general');

      expect(result).toHaveProperty('program');
      expect(result).toHaveProperty('governorate');
      expect(result).toHaveProperty('village');
      expect(result).toHaveProperty('family');
      expect(result.program).toHaveProperty('id');
      expect(result.program).toHaveProperty('name');
      expect(result.governorate).toHaveProperty('id');
      expect(result.governorate).toHaveProperty('name');
    });

    it('should respect governorate lock for location-fixed donation', async () => {
      const result = await selectBeneficiary('location-fixed', 'minya');

      expect(result.governorate.id).toBe('minya');
      expect(result.village.governorateId).toBe('minya');
    });

    it('should respect program lock for program-fixed donation', async () => {
      const result = await selectBeneficiary('program-fixed', 'ramadan');

      expect(result.program.id).toBe('ramadan');
    });

    it('should select valid village within governorate', async () => {
      const result = await selectBeneficiary('location-fixed', 'minya');

      expect(result.village.governorateId).toBe('minya');
      expect(result.village).toHaveProperty('name');
      expect(result.village).toHaveProperty('lon');
      expect(result.village).toHaveProperty('lat');
    });

    it('should select valid family within village', async () => {
      const result = await selectBeneficiary('general');

      expect(result.family).toHaveProperty('id');
      expect(result.family).toHaveProperty('profile');
      expect(result.family).toHaveProperty('programId');
      expect(result.family).toHaveProperty('villageId');
    });

    it('should throw error for invalid donation type', async () => {
      await expect(selectBeneficiary('invalid' as any)).rejects.toThrow('Unknown donation type');
    });
  });
});