// GSTIN validation (India)
export function validateGstin(gstin: string): boolean {
  if (!gstin || gstin.length !== 15) return false;
  
  // Format: 2 digits (state) + 10 alphanumeric (PAN) + 1 digit (entity) + 1 letter (Z) + 1 alphanumeric (checksum)
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin);
}

// Phone validation (E.164 format)
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
}

// Email validation (RFC5322 simplified)
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// URL validation
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Postal code validation (India)
export function validatePostalCode(code: string, country: string = "IN"): boolean {
  if (country === "IN") {
    return /^[1-9][0-9]{5}$/.test(code);
  }
  return true; // Add more country validations as needed
}
