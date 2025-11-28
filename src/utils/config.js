export const config = {
  adminEmail: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@example.com',
  withdrawalCodeExpiry: 15 * 60 * 1000, // 15 minutes in milliseconds
  minPasswordLength: 8,
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  errorMessages: {
    invalidEmail: 'Please enter a valid email address',
    weakPassword: 'Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters',
    emailInUse: 'An account already exists with this email. Try logging in.',
    loginFailed: 'Incorrect email or password',
    verificationNeeded: 'Please complete the human verification',
    serverError: 'An error occurred. Please try again later.',
    adminOnly: 'This action requires admin privileges'
  }
};

export const validatePassword = (password) => {
  const hasNumber = /[0-9]/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);

  return {
    isValid: password.length >= config.minPasswordLength && hasNumber && hasLetter && hasSpecialChar,
    hasMinLength: password.length >= config.minPasswordLength,
    hasNumber: hasNumber,
    hasLetter: hasLetter,
    hasSpecialChar: hasSpecialChar,
    hasUpperCase: hasUpperCase,
    hasLowerCase: hasLowerCase,
    strength: calculatePasswordStrength(password)
  };
};

export const calculatePasswordStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;

  if (score <= 2) return 'weak';
  if (score <= 4) return 'medium';
  return 'strong';
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

export const sanitizeUserData = (userData) => {
  const { password, ...safeData } = userData;
  return {
    ...safeData,
    password: '******'
  };
};