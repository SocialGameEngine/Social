export function validateRoomCode(code: string): boolean {
  // Room code: 6 alphanumeric characters
  return /^[A-Z0-9]{6}$/i.test(code);
}

export function sanitizeInput(input: string): string {
  // Remove potential XSS vectors
  return input
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 500); // Max 500 characters
}

export function validateAnswer(answer: string, roundType?: string): { valid: boolean; error?: string } {
  const sanitized = sanitizeInput(answer);
  
  if (!sanitized) {
    return { valid: false, error: 'Answer cannot be empty' };
  }
  
  // For trivia rounds, allow very short answers (even single characters)
  // For other rounds, require at least 3 characters
  const minLength = roundType === 'trivia' ? 1 : 3;
  
  if (sanitized.length < minLength) {
    if (roundType === 'trivia') {
      return { valid: false, error: 'Answer cannot be empty' };
    } else {
      return { valid: false, error: 'Answer must be at least 3 characters' };
    }
  }
  
  if (sanitized.length > 500) {
    return { valid: false, error: 'Answer must be less than 500 characters' };
  }
  
  return { valid: true };
}

export function validatePlayerName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  
  if (!trimmed) {
    return { valid: false, error: 'Name cannot be empty' };
  }
  
  if (trimmed.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' };
  }
  
  if (trimmed.length > 30) {
    return { valid: false, error: 'Name must be less than 30 characters' };
  }
  
  return { valid: true };
}
