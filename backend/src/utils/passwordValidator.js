/**
 * Password Validation Utility for HIPAA Compliance
 * 
 * HIPAA Security Rule Requirements:
 * - Unique user identification
 * - Emergency access procedure
 * - Automatic logoff
 * - Encryption and decryption
 */

/**
 * Password complexity requirements
 */
const PASSWORD_REQUIREMENTS = {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxRepeatingChars: 3,
    preventCommonPasswords: true,
};

/**
 * Common passwords to block (top 100 most common)
 * In production, use a comprehensive dictionary
 */
const COMMON_PASSWORDS = [
    'password', 'password123', '123456', '12345678', 'qwerty', 'abc123',
    'monkey', '1234567', 'letmein', 'trustno1', 'dragon', 'baseball',
    'iloveyou', 'master', 'sunshine', 'ashley', 'bailey', 'passw0rd',
    'shadow', '123123', '654321', 'superman', 'qazwsx', 'michael',
    'football', 'welcome', 'jesus', 'ninja', 'mustang', 'password1',
    'admin', 'admin123', 'root', 'toor', 'pass', 'test', 'guest',
    'info', 'adm', 'mysql', 'user', 'administrator', 'oracle',
    'ftp', 'pi', 'puppet', 'ansible', 'ec2-user', 'vagrant',
    'azureuser', 'pharmacy', 'hoperx', 'medical', 'hospital'
];

/**
 * Validate password against complexity requirements
 * @param {string} password - Password to validate
 * @returns {object} { valid: boolean, errors: string[] }
 */
function validatePassword(password) {
    const errors = [];

    if (!password) {
        return { valid: false, errors: ['Password is required'] };
    }

    // Check minimum length
    if (password.length < PASSWORD_REQUIREMENTS.minLength) {
        errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
    }

    // Check uppercase requirement
    if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter (A-Z)');
    }

    // Check lowercase requirement
    if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter (a-z)');
    }

    // Check number requirement
    if (PASSWORD_REQUIREMENTS.requireNumbers && !/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number (0-9)');
    }

    // Check special character requirement
    if (PASSWORD_REQUIREMENTS.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{};\':"|,.<>/?)');
    }

    // Check for repeating characters
    if (PASSWORD_REQUIREMENTS.maxRepeatingChars) {
        const repeatingPattern = new RegExp(`(.)\\1{${PASSWORD_REQUIREMENTS.maxRepeatingChars},}`);
        if (repeatingPattern.test(password)) {
            errors.push(`Password cannot contain more than ${PASSWORD_REQUIREMENTS.maxRepeatingChars} repeating characters`);
        }
    }

    // Check against common passwords
    if (PASSWORD_REQUIREMENTS.preventCommonPasswords) {
        const lowerPassword = password.toLowerCase();
        if (COMMON_PASSWORDS.some(common => lowerPassword.includes(common))) {
            errors.push('Password is too common or easily guessable. Please choose a stronger password');
        }
    }

    // Check for sequential characters
    if (hasSequentialCharacters(password)) {
        errors.push('Password cannot contain sequential characters (e.g., abc, 123)');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Check if password contains sequential characters
 * @param {string} password - Password to check
 * @returns {boolean} True if sequential characters found
 */
function hasSequentialCharacters(password) {
    const sequences = [
        'abcdefghijklmnopqrstuvwxyz',
        '01234567890',
        'qwertyuiop',
        'asdfghjkl',
        'zxcvbnm'
    ];

    const lowerPassword = password.toLowerCase();

    for (const sequence of sequences) {
        for (let i = 0; i <= sequence.length - 4; i++) {
            const forward = sequence.substring(i, i + 4);
            const backward = forward.split('').reverse().join('');

            if (lowerPassword.includes(forward) || lowerPassword.includes(backward)) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Generate password strength score (0-100)
 * @param {string} password - Password to score
 * @returns {object} { score: number, strength: string, feedback: string }
 */
function getPasswordStrength(password) {
    let score = 0;

    // Length score (up to 40 points)
    score += Math.min(password.length * 2, 40);

    // Character variety (up to 40 points)
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/[0-9]/.test(password)) score += 10;
    if (/[^a-zA-Z0-9]/.test(password)) score += 10;

    // Complexity bonus (up to 20 points)
    const uniqueChars = new Set(password).size;
    score += Math.min(uniqueChars, 20);

    // Determine strength level
    let strength, feedback;

    if (score < 40) {
        strength = 'weak';
        feedback = 'Very weak password. Please add more characters and variety.';
    } else if (score < 60) {
        strength = 'fair';
        feedback = 'Fair password. Consider adding more special characters.';
    } else if (score < 80) {
        strength = 'good';
        feedback = 'Good password strength.';
    } else {
        strength = 'strong';
        feedback = 'Strong password!';
    }

    return { score: Math.min(score, 100), strength, feedback };
}

/**
 * Check if password has been compromised in known data breaches
 * Note: In production, use the HaveIBeenPwned API
 * @param {string} password - Password to check
 * @returns {Promise<boolean>} True if password is compromised
 */
async function isPasswordCompromised(password) {
    // Placeholder - in production, integrate with HaveIBeenPwned API
    // For now, just check against common passwords
    return COMMON_PASSWORDS.some(common => password.toLowerCase().includes(common));
}

module.exports = {
    validatePassword,
    getPasswordStrength,
    isPasswordCompromised,
    PASSWORD_REQUIREMENTS,
};
