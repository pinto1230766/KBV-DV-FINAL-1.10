/// <reference types="vitest" />
import { generateUUID, generateShortId } from './uuid';

describe('UUID Utils', () => {
  describe('generateUUID', () => {
    it('should return a string', () => {
      const uuid = generateUUID();
      expect(typeof uuid).toBe('string');
    });

    it('should return a valid UUID v4 format', () => {
      const uuid = generateUUID();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuid).toMatch(uuidRegex);
    });

    it('should generate unique UUIDs', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe('generateShortId', () => {
    it('should return a string', () => {
      const id = generateShortId();
      expect(typeof id).toBe('string');
    });

    it('should generate unique IDs', () => {
      const id1 = generateShortId();
      const id2 = generateShortId();
      expect(id1).not.toBe(id2);
    });
  });
});
