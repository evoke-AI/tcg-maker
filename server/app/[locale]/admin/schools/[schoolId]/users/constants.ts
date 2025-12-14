// Hong Kong Education System Grade Levels
export const HK_GRADE_LEVELS = [
  // Pre-primary Education
  { value: 'K1', label: 'K1 (Kindergarten 1)', category: 'Pre-primary' },
  { value: 'K2', label: 'K2 (Kindergarten 2)', category: 'Pre-primary' },
  { value: 'K3', label: 'K3 (Kindergarten 3)', category: 'Pre-primary' },
  
  // Primary Education (6 years)
  { value: 'P1', label: 'P1 (Primary 1)', category: 'Primary' },
  { value: 'P2', label: 'P2 (Primary 2)', category: 'Primary' },
  { value: 'P3', label: 'P3 (Primary 3)', category: 'Primary' },
  { value: 'P4', label: 'P4 (Primary 4)', category: 'Primary' },
  { value: 'P5', label: 'P5 (Primary 5)', category: 'Primary' },
  { value: 'P6', label: 'P6 (Primary 6)', category: 'Primary' },
  
  // Secondary Education (6 years)
  { value: 'S1', label: 'S1 (Secondary 1)', category: 'Junior Secondary' },
  { value: 'S2', label: 'S2 (Secondary 2)', category: 'Junior Secondary' },
  { value: 'S3', label: 'S3 (Secondary 3)', category: 'Junior Secondary' },
  { value: 'S4', label: 'S4 (Secondary 4)', category: 'Senior Secondary' },
  { value: 'S5', label: 'S5 (Secondary 5)', category: 'Senior Secondary' },
  { value: 'S6', label: 'S6 (Secondary 6)', category: 'Senior Secondary' },
  
  // Other
  { value: 'OTHER', label: 'Other', category: 'Other' },
];

// Group grade levels by category for better UX
export const GRADE_LEVEL_CATEGORIES = {
  'Pre-primary': HK_GRADE_LEVELS.filter(g => g.category === 'Pre-primary'),
  'Primary': HK_GRADE_LEVELS.filter(g => g.category === 'Primary'),
  'Junior Secondary': HK_GRADE_LEVELS.filter(g => g.category === 'Junior Secondary'),
  'Senior Secondary': HK_GRADE_LEVELS.filter(g => g.category === 'Senior Secondary'),
  'Other': HK_GRADE_LEVELS.filter(g => g.category === 'Other'),
}; 