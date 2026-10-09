import { z } from 'zod';

export const EVENT_DATE = '16th October, 2026';
export const FLYER_WIDTH = 1536;
export const FLYER_HEIGHT = 2752;

export const CATEGORY_OPTIONS = ['Student', 'Graduate', 'Entrepreneur'] as const;

export const personalDetailsSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name.').max(60, 'Use up to 60 characters.'),
  category: z.enum(CATEGORY_OPTIONS, { message: 'Select your category.' }),
});

export function validatePhoto(file: Pick<File, 'type' | 'size'>) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return 'Choose a JPG, PNG or WebP image.';
  if (file.size > 10 * 1024 * 1024) return 'Choose an image smaller than 10 MB.';
  if (file.size === 0) return 'This image is empty. Choose another photo.';
  return null;
}
