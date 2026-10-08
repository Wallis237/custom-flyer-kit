import { describe, expect, it } from 'vitest';
import { EVENT_DATE, personalDetailsSchema, validatePhoto } from '@/lib/flyer';
describe('Flyer rules', () => {
  it('uses the requested October 23 workshop date', () => { expect(EVENT_DATE).toBe('23rd October, 2026'); });
  it('requires a name and title', () => {
    expect(personalDetailsSchema.safeParse({ name: '', title: 'Engineer' }).success).toBe(false);
    expect(personalDetailsSchema.safeParse({ name: 'Denis', title: '' }).success).toBe(false);
    expect(personalDetailsSchema.parse({ name: ' Denis ', title: ' Engineer ' })).toEqual({ name: 'Denis', title: 'Engineer' });
  });
  it('accepts supported photos and rejects non-images', () => {
    expect(validatePhoto({ type: 'image/jpeg', size: 1000 })).toBeNull();
    expect(validatePhoto({ type: 'text/html', size: 1000 })).not.toBeNull();
    expect(validatePhoto({ type: 'image/png', size: 11 * 1024 * 1024 })).not.toBeNull();
  });
});