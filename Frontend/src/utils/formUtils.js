// Form formatting and validation utilities

// Format Aadhaar number with spaces (1234 5678 9012)
export const formatAadhaarNumber = (value) => {
  if (!value) return '';
  const cleaned = value.replace(/\s/g, '');
  const match = cleaned.match(/^(\d{0,4})(\d{0,4})(\d{0,4})$/);
  if (!match) return cleaned;
  return [match[1], match[2], match[3]].filter(Boolean).join(' ');
};

// Format PAN number (ABCDE1234F)
export const formatPANNumber = (value) => {
  if (!value) return '';
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
};

// Format phone number (98765 43210)
export const formatPhoneNumber = (value) => {
  if (!value) return '';
  const cleaned = value.replace(/\s/g, '');
  if (cleaned.length <= 5) return cleaned;
  return cleaned.replace(/(\d{5})(\d{0,5})/, '$1 $2');
};

// Format pincode (123456)
export const formatPincode = (value) => {
  if (!value) return '';
  return value.replace(/\D/g, '').substring(0, 6);
};

// Format amount (₹ 1,00,000)
export const formatAmount = (value) => {
  if (!value) return '';
  const cleaned = value.replace(/[₹,\s]/g, '');
  const number = parseFloat(cleaned);
  if (isNaN(number)) return '';
  return `₹ ${number.toLocaleString('en-IN')}`;
};

// Validation functions
export const validateAadhaar = (aadhaar) => {
  const cleaned = aadhaar.replace(/\s/g, '');
  if (!cleaned) return { isValid: false, message: 'Aadhaar number is required' };
  if (cleaned.length !== 12) return { isValid: false, message: 'Aadhaar number must be 12 digits' };
  if (!/^\d{12}$/.test(cleaned)) return { isValid: false, message: 'Aadhaar number must contain only digits' };
  return { isValid: true, message: '' };
};

export const validatePAN = (pan) => {
  if (!pan) return { isValid: false, message: 'PAN number is required' };
  if (pan.length !== 10) return { isValid: false, message: 'PAN number must be 10 characters' };
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
    return { isValid: false, message: 'PAN must be in format: ABCDE1234F' };
  }
  return { isValid: true, message: '' };
};

export const validatePhone = (phone) => {
  const cleaned = phone.replace(/\s/g, '');
  if (!cleaned) return { isValid: false, message: 'Phone number is required' };
  if (cleaned.length !== 10) return { isValid: false, message: 'Phone number must be 10 digits' };
  if (!/^\d{10}$/.test(cleaned)) return { isValid: false, message: 'Phone number must contain only digits' };
  return { isValid: true, message: '' };
};

export const validateEmail = (email) => {
  if (!email) return { isValid: false, message: 'Email is required' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }
  return { isValid: true, message: '' };
};

export const validatePincode = (pincode) => {
  if (!pincode) return { isValid: false, message: 'Pincode is required' };
  if (pincode.length !== 6) return { isValid: false, message: 'Pincode must be 6 digits' };
  if (!/^\d{6}$/.test(pincode)) return { isValid: false, message: 'Pincode must contain only digits' };
  return { isValid: true, message: '' };
};

export const validateAmount = (amount) => {
  const cleaned = amount.replace(/[₹,\s]/g, '');
  if (!cleaned) return { isValid: false, message: 'Amount is required' };
  const number = parseFloat(cleaned);
  if (isNaN(number) || number <= 0) return { isValid: false, message: 'Please enter a valid amount' };
  if (number > 10000000) return { isValid: false, message: 'Amount cannot exceed ₹1,00,00,000' };
  return { isValid: true, message: '' };
};

export const validateRequired = (value, fieldName) => {
  if (!value || value.trim() === '') {
    return { isValid: false, message: `${fieldName} is required` };
  }
  return { isValid: true, message: '' };
};

export const validateDate = (date) => {
  if (!date) return { isValid: false, message: 'Date is required' };
  const selectedDate = new Date(date);
  const today = new Date();
  if (selectedDate > today) return { isValid: false, message: 'Date cannot be in the future' };
  if (selectedDate < new Date('1900-01-01')) return { isValid: false, message: 'Please enter a valid date' };
  return { isValid: true, message: '' };
};

// Professional placeholders
export const PLACEHOLDERS = {
  firstName: 'Enter your first name',
  lastName: 'Enter your last name',
  email: 'your.email@example.com',
  phone: '98765 43210',
  aadhaar: '1234 5678 9012',
  pan: 'ABCDE1234F',
  pincode: '400001',
  amount: '₹ 50,000',
  incidentDate: 'Select incident date',
  description: 'Describe the incident in detail...',
  address: 'Enter complete address',
  city: 'Enter city name',
  state: 'Enter state name',
  bankName: 'State Bank of India',
  accountNumber: '1234567890',
  ifscCode: 'SBIN0001234',
  branchName: 'Main Branch'
};

// Input types and configurations
export const INPUT_CONFIGS = {
  firstName: {
    type: 'text',
    placeholder: PLACEHOLDERS.firstName,
    maxLength: 50,
    required: true
  },
  lastName: {
    type: 'text',
    placeholder: PLACEHOLDERS.lastName,
    maxLength: 50,
    required: true
  },
  email: {
    type: 'email',
    placeholder: PLACEHOLDERS.email,
    maxLength: 100,
    required: true
  },
  phone: {
    type: 'tel',
    placeholder: PLACEHOLDERS.phone,
    maxLength: 12,
    required: true
  },
  aadhaar: {
    type: 'text',
    placeholder: PLACEHOLDERS.aadhaar,
    maxLength: 14,
    required: true
  },
  pan: {
    type: 'text',
    placeholder: PLACEHOLDERS.pan,
    maxLength: 10,
    required: true
  },
  pincode: {
    type: 'text',
    placeholder: PLACEHOLDERS.pincode,
    maxLength: 6,
    required: true
  },
  amount: {
    type: 'text',
    placeholder: PLACEHOLDERS.amount,
    maxLength: 15,
    required: true
  },
  incidentDate: {
    type: 'date',
    placeholder: PLACEHOLDERS.incidentDate,
    required: true
  },
  description: {
    type: 'textarea',
    placeholder: PLACEHOLDERS.description,
    maxLength: 1000,
    required: true
  }
};

export default {
  formatAadhaarNumber,
  formatPANNumber,
  formatPhoneNumber,
  formatPincode,
  formatAmount,
  validateAadhaar,
  validatePAN,
  validatePhone,
  validateEmail,
  validatePincode,
  validateAmount,
  validateRequired,
  validateDate,
  PLACEHOLDERS,
  INPUT_CONFIGS
};
