import { workTypeShort, seniorityLabel, employmentShort } from '../jobLabels';

describe('jobLabels utilities', () => {
  describe('workTypeShort', () => {
    it('returns Turkish labels for work types', () => {
      expect(workTypeShort('remote')).toBe('Uzaktan');
      expect(workTypeShort('hybrid')).toBe('Hibrit');
      expect(workTypeShort('office')).toBe('Ofis');
      expect(workTypeShort('unknown')).toBe('');
    });
  });

  describe('seniorityLabel', () => {
    it('returns correct seniority label display names', () => {
      expect(seniorityLabel('junior')).toBe('Junior');
      expect(seniorityLabel('mid')).toBe('Mid');
      expect(seniorityLabel('senior')).toBe('Senior');
      expect(seniorityLabel('lead')).toBe('Lead');
      expect(seniorityLabel('unknown')).toBe('');
    });
  });

  describe('employmentShort', () => {
    it('returns Turkish short labels for employment types', () => {
      expect(employmentShort('fulltime')).toBe('Tam Zamanlı');
      expect(employmentShort('parttime')).toBe('Yarı Zamanlı');
      expect(employmentShort('contract')).toBe('Sözleşmeli');
      expect(employmentShort('internship')).toBe('Staj');
      expect(employmentShort('')).toBe('');
    });
  });
});
