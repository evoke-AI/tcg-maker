/**
 * Password generation utility for school users
 * Generates passwords in the format "word-word-word" with 12+ characters
 */

const WORD_LISTS = {
  learning: [
    'learning', 'studying', 'reading', 'writing', 'thinking', 'growing', 
    'exploring', 'discovering', 'teaching', 'practice', 'homework', 'lesson'
  ],
  positive: [
    'bright', 'smart', 'clever', 'quick', 'wise', 'kind', 'happy', 'cheerful',
    'friendly', 'helpful', 'creative', 'curious', 'brave', 'strong', 'gentle'
  ],
  descriptive: [
    'fun', 'cool', 'awesome', 'great', 'super', 'amazing', 'wonderful', 
    'fantastic', 'excellent', 'brilliant', 'perfect', 'special', 'unique'
  ],
  colors: [
    'blue', 'green', 'red', 'yellow', 'purple', 'orange', 'pink', 'silver',
    'golden', 'rainbow', 'bright', 'light', 'dark', 'clear', 'shiny'
  ],
  nature: [
    'tree', 'flower', 'star', 'moon', 'sun', 'ocean', 'mountain', 'river',
    'garden', 'forest', 'cloud', 'rainbow', 'butterfly', 'bird', 'fish'
  ]
};

/**
 * Generates a random password in the format "word-word-word"
 * Ensures the password is at least 12 characters long
 * @returns A generated password string
 */
export function generatePassword(): string {
  const wordCategories = Object.values(WORD_LISTS);
  
  // Select three random words from different categories
  const word1 = getRandomWord(wordCategories[0]);
  const word2 = getRandomWord(wordCategories[1]);
  const word3 = getRandomWord(wordCategories[2]);
  
  let password = `${word1}-${word2}-${word3}`;
  
  // Ensure password is at least 12 characters
  while (password.length < 12) {
    const extraWord = getRandomWord(wordCategories[Math.floor(Math.random() * wordCategories.length)]);
    password += `-${extraWord}`;
  }
  
  return password;
}

/**
 * Generates multiple unique passwords
 * @param count Number of passwords to generate
 * @returns Array of unique password strings
 */
export function generatePasswords(count: number): string[] {
  const passwords = new Set<string>();
  
  while (passwords.size < count) {
    passwords.add(generatePassword());
  }
  
  return Array.from(passwords);
}

/**
 * Validates if a password meets the school requirements
 * @param password Password to validate
 * @returns Object with validation result and message
 */
export function validatePassword(password: string): { isValid: boolean; message: string } {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }
  
  if (password.length < 12) {
    return { isValid: false, message: 'Password must be at least 12 characters long' };
  }
  
  return { isValid: true, message: 'Password is valid' };
}

/**
 * Generates a CSV-friendly password list for download
 * @param userPasswords Array of objects with user info and passwords
 * @returns CSV string ready for download
 */
export function generatePasswordCSV(userPasswords: Array<{
  username: string;
  password: string;
  name?: string;
  role?: string;
  studentId?: string;
}>): string {
  const headers = ['Username', 'Password', 'Name', 'Role', 'Student ID'];
  const rows = userPasswords.map(user => [
    user.username,
    user.password,
    user.name || '',
    user.role || '',
    user.studentId || ''
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');
  
  return csvContent;
}

/**
 * Creates a secure filename for password downloads
 * @param schoolCode School code for the filename
 * @returns Secure filename string
 */
export function generatePasswordFileName(schoolCode: string): string {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
  return `passwords-${schoolCode}-${timestamp}.csv`;
}

// Helper function to get a random word from an array
function getRandomWord(words: string[]): string {
  return words[Math.floor(Math.random() * words.length)];
}

// Export word lists for testing or customization
export { WORD_LISTS }; 