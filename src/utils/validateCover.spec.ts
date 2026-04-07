import { describe, it, expect } from 'vitest';
import { validateFiles, hasValidCover, validateForm } from './validateCover';

describe('validateCover', () => {
  it('should return true when cover.jpg is present (case insensitive)', () => {
    const files = [
      new File([], 'image1.png'),
      new File([], 'COVER.JPG')
    ];
    expect(hasValidCover(files)).toBe(true);
  });

  it('should return false when cover.jpg is missing', () => {
    const files = [
      new File([], 'image1.png'),
      new File([], 'cover.png')
    ];
    expect(hasValidCover(files)).toBe(false);
  });

  it('should validate file sizes and types', () => {
    const validFiles = [
      new File([''], 'cover.jpg', { type: 'image/jpeg' }),
      new File([''], 'test.png', { type: 'image/png' })
    ];
    const result = validateFiles(validFiles);
    expect(result.valid).toBe(true);
  });

  it('should reject files larger than 5MB', () => {
    const largeFile = new File([''], 'cover.jpg', { type: 'image/jpeg' });
    Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 });
    const result = validateFiles([largeFile]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('单张图片不能超过 5MB');
  });

  it('should reject invalid file types', () => {
    const invalidFile = new File([''], 'document.pdf', { type: 'application/pdf' });
    const result = validateFiles([invalidFile, new File([''], 'cover.jpg', { type: 'image/jpeg' })]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('文件格式不支持');
  });
});

describe('validateForm', () => {
  it('should return valid when title is provided', () => {
    expect(validateForm({ title: 'Album 1' }).valid).toBe(true);
  });

  it('should reject empty title', () => {
    expect(validateForm({ title: '   ' }).valid).toBe(false);
    expect(validateForm({ title: '' }).valid).toBe(false);
  });

  it('should validate date format YYYY-MM-DD', () => {
    expect(validateForm({ title: 'Album', date: '2025-01-01' }).valid).toBe(true);
    expect(validateForm({ title: 'Album', date: '2025/01/01' }).valid).toBe(false);
    expect(validateForm({ title: 'Album', date: 'invalid' }).valid).toBe(false);
  });

  it('should validate columns constraint', () => {
    expect(validateForm({ title: 'Album', columns: 3 }).valid).toBe(true);
    expect(validateForm({ title: 'Album', columns: 1 }).valid).toBe(false);
    expect(validateForm({ title: 'Album', columns: 5 }).valid).toBe(false);
  });
});
