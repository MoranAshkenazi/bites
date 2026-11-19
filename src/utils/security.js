const crypto = require('crypto');
const { promisify } = require('util');

const scryptAsync = promisify(crypto.scrypt);
const KEY_LENGTH = 64;

// The JWT secret must come from the environment, never from the source code.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
}

// Hashes a password with a random salt using scrypt.
// Format: scrypt$<saltHex>$<hashHex>
const hashPassword = async (password) => {
    const salt = crypto.randomBytes(16);
    const derived = await scryptAsync(password, salt, KEY_LENGTH);
    return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`;
};

// Checks a password against a stored hash.
// Accepts scrypt hashes and legacy unsalted SHA-256 hashes; `needsRehash`
// is true when the password matched a legacy hash and should be upgraded.
const verifyPassword = async (password, stored) => {
    if (typeof stored !== 'string' || typeof password !== 'string') {
        return { valid: false, needsRehash: false };
    }

    if (stored.startsWith('scrypt$')) {
        const [, saltHex, hashHex] = stored.split('$');
        if (!saltHex || !hashHex) return { valid: false, needsRehash: false };
        const expected = Buffer.from(hashHex, 'hex');
        const derived = await scryptAsync(password, Buffer.from(saltHex, 'hex'), expected.length);
        return { valid: crypto.timingSafeEqual(derived, expected), needsRehash: false };
    }

    // Legacy: unsalted SHA-256 hex digest
    const legacy = crypto.createHash('sha256').update(password).digest('hex');
    const matches = stored.length === legacy.length &&
        crypto.timingSafeEqual(Buffer.from(stored), Buffer.from(legacy));
    return { valid: matches, needsRehash: matches };
};

module.exports = { JWT_SECRET, hashPassword, verifyPassword };
